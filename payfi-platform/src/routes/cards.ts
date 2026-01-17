// ============================================================================
// FILE: cards.ts
// PURPOSE: Virtual card management and card spending endpoints
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";

import { merchantKycMap, frozenMerchants } from "./compliance";
import { evaluateRisk } from "../compliance/riskEngine";
import { KYCLevel, KYC_LEVELS } from "../compliance/kycLevels";

const router = Router();

/**
 * complianceCheck
 *
 * Unified compliance validation for card operations.
 * Checks if a merchant is allowed to perform a transaction based on:
 * 1. Account frozen status (hard block)
 * 2. KYC level and associated transaction limits
 *
 * @param merchantId - The merchant attempting the transaction
 * @param amount - The transaction amount to validate
 * @returns Object: { allowed: boolean, reason?: string }
 *
 * Decision Tree:
 * - If merchant is frozen → ACCOUNT_FROZEN (always reject)
 * - Otherwise → check KYC limits via evaluateRisk()
 */
async function complianceCheck(merchantId: number, amount: number) {
    // First check: Is this merchant's account frozen?
    if (frozenMerchants.has(merchantId)) {
        return { allowed: false, reason: "ACCOUNT_FROZEN" };
    }

    // Determine merchant's KYC level
    // Default to Unverified if never explicitly set
    const kycLevel: KYCLevel =
        merchantKycMap[merchantId] ?? KYC_LEVELS.Unverified;

    // Delegate to risk engine for KYC limit checking
    return evaluateRisk({
        merchantId,
        kycLevel,
        amount,
        dailyTotal: amount, // Simplified: only check current transaction
        recentTxCount: 1,
        recentAmounts: [amount],
    });
}

/**
 * POST /api/cards
 *
 * Creates a new virtual card for the merchant.
 * Virtual cards are linked to the merchant's wallet for spending.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Request Body: None (auto-generated card details)
 *
 * Response:
 * {
 *   "message": "Card created successfully",
 *   "card": {
 *     "id": number,
 *     "merchant_id": number,
 *     "card_number": "4242-4242-4242-XXXX",
 *     "status": "active",
 *     "created_at": timestamp
 *   }
 * }
 *
 * Implementation:
 * - Generates random 16-digit card number (test format: 4242-4242-4242-XXXX)
 * - Status always "active" for new cards
 * - Linked to authenticated merchant
 * - Stored in cards table with creation timestamp
 */
router.post("/cards", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;

    try {
        // Insert new card record with auto-generated card number
        const result = await query(
            "INSERT INTO cards (merchant_id, card_number, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
            [
                merchantId,
                `4242-4242-4242-${Math.floor(Math.random() * 9000 + 1000)}`,
                "active",
            ]
        );

        res.json({
            message: "Card created successfully",
            card: result.rows[0],
        });
    } catch {
        res.status(500).json({ error: "Failed to create card" });
    }
});

/**
 * GET /api/cards
 *
 * Lists all virtual cards owned by the authenticated merchant.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Response:
 * {
 *   "cards": [
 *     {
 *       "id": number,
 *       "merchant_id": number,
 *       "card_number": "4242-4242-4242-XXXX",
 *       "status": "active",
 *       "created_at": timestamp
 *     },
 *     ...
 *   ]
 * }
 *
 * Implementation:
 * - Queries cards table filtered by merchant_id
 * - Returns cards in creation order (oldest first)
 */
router.get("/cards", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;
        const result = await query(
            "SELECT * FROM cards WHERE merchant_id = $1 ORDER BY created_at ASC",
            [merchantId]
        );
        res.json({ cards: result.rows });
    } catch {
        res.status(500).json({ error: "Failed to fetch cards" });
    }
});

/**
 * POST /api/cards/spend
 *
 * Deducts funds from merchant's wallet using a virtual card.
 * This simulates a cardholder making a purchase.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Request Body:
 * {
 *   "amount": number (required, must be > 0)
 * }
 *
 * Response on Success:
 * {
 *   "message": "Card spend approved",
 *   "balance": number (new wallet balance)
 * }
 *
 * Response on Failure:
 * {
 *   "error": "REASON_CODE"
 * }
 *
 * Possible Error Codes:
 * - "Invalid amount" (400): amount not provided or <= 0
 * - "KYC_TX_LIMIT" (403): transaction exceeds KYC limit
 * - "KYC_BALANCE_LIMIT" (403): daily total exceeds balance limit
 * - "Wallet not found" (404): merchant has no wallet
 * - "Insufficient balance" (400): wallet balance too low
 * - "Card spend failed" (500): database error during update
 *
 * Implementation:
 * 1. Validate amount > 0
 * 2. Run compliance check (KYC limits, frozen status)
 * 3. Verify wallet exists and has sufficient balance
 * 4. Deduct amount from wallet balance
 * 5. Record transaction in transactions table with type "card_spend"
 * 6. Return new balance
 */
router.post("/cards/spend", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Input validation: amount must be positive number
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    // Compliance check: Does transaction comply with KYC limits?
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed) {
        return res.status(403).json({ error: compliance.reason });
    }

    try {
        // Fetch merchant's wallet
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        // Error: Wallet doesn't exist
        if (walletResult.rowCount === 0) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const wallet = walletResult.rows[0];

        // Error: Insufficient balance to cover spend
        if (wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Calculate new balance after spending
        const newBalance = Number(wallet.balance) - Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in the ledger for audit trail
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [merchantId, wallet.id, "card_spend", amount, newBalance]
        );

        res.json({ message: "Card spend approved", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Card spend failed" });
    }
});

export default router;
