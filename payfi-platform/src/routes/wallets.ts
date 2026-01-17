// ============================================================================
// FILE: wallets.ts
// PURPOSE: Wallet management - deposits, withdrawals, and balance tracking
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
 * Unified compliance validation for wallet operations (deposits/withdrawals).
 * Checks if a merchant is allowed to move funds based on:
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
 * POST /api/wallets
 *
 * Creates a new wallet for the authenticated merchant.
 * Wallet stores the merchant's account balance and tracks all transactions.
 * Each merchant can have multiple wallets (but typically just one).
 *
 * Authentication: Required (X-API-Key header)
 *
 * Request Body: None (system-generated)
 *
 * Response on Success:
 * {
 *   "message": "Wallet created successfully",
 *   "wallet": {
 *     "id": number (unique wallet ID),
 *     "merchant_id": number,
 *     "balance": 0 (always starts at zero)
 *   }
 * }
 *
 * Response on Error:
 * {
 *   "error": "Failed to create wallet"
 * }
 * HTTP: 500 Internal Server Error
 *
 * Implementation:
 * - Creates wallet record with initial balance = 0
 * - Linked to authenticated merchant
 * - Returns wallet details with auto-generated wallet ID
 */
router.post("/wallets", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        // Insert new wallet record with zero initial balance
        const result = await query(
            "INSERT INTO wallets (merchant_id, balance, created_at) VALUES ($1, 0, NOW()) RETURNING id, merchant_id, balance",
            [merchantId]
        );

        res.json({
            message: "Wallet created successfully",
            wallet: result.rows[0],
        });
    } catch {
        res.status(500).json({ error: "Failed to create wallet" });
    }
});

/**
 * POST /api/wallets/deposit
 *
 * Deposits funds into a merchant's wallet.
 * Increases wallet balance and records transaction.
 * Subject to KYC compliance limits.
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
 *   "message": "Deposit successful",
 *   "balance": number (new wallet balance after deposit)
 * }
 *
 * Response on Failure:
 * {
 *   "error": "REASON_CODE"
 * }
 *
 * Possible Error Codes:
 * - "KYC_TX_LIMIT" (403): deposit amount exceeds KYC limit
 * - "KYC_BALANCE_LIMIT" (403): total balance would exceed KYC limit
 * - "Deposit failed" (500): database error during update
 *
 * Implementation:
 * 1. Run compliance check (KYC limits, frozen status)
 * 2. Fetch merchant's wallet
 * 3. Calculate new balance = current + deposit amount
 * 4. Update wallet balance in database
 * 5. Record transaction in ledger
 * 6. Return new balance to client
 */
router.post("/wallets/deposit", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Run compliance check before processing deposit
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

        const wallet = walletResult.rows[0];
        // Calculate new balance after adding deposit
        const newBalance = Number(wallet.balance) + Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in the ledger for audit trail
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [merchantId, wallet.id, "deposit", amount, newBalance]
        );

        res.json({ message: "Deposit successful", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Deposit failed" });
    }
});

/**
 * POST /api/wallets/withdraw
 *
 * Withdraws funds from a merchant's wallet.
 * Decreases wallet balance and records transaction.
 * Subject to KYC compliance limits and balance availability.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Request Body:
 * {
 *   "amount": number (required, must be > 0 and <= current balance)
 * }
 *
 * Response on Success:
 * {
 *   "message": "Withdrawal successful",
 *   "balance": number (new wallet balance after withdrawal)
 * }
 *
 * Response on Failure:
 * {
 *   "error": "REASON_CODE"
 * }
 *
 * Possible Error Codes:
 * - "KYC_TX_LIMIT" (403): withdrawal amount exceeds KYC limit
 * - "KYC_BALANCE_LIMIT" (403): daily total exceeds balance limit
 * - "Insufficient balance" (400): not enough funds to withdraw
 * - "Withdraw failed" (500): database error during update
 *
 * Implementation:
 * 1. Run compliance check (KYC limits, frozen status)
 * 2. Fetch merchant's wallet
 * 3. Verify sufficient balance available
 * 4. Calculate new balance = current - withdrawal amount
 * 5. Update wallet balance in database
 * 6. Record transaction in ledger
 * 7. Return new balance to client
 */
router.post("/wallets/withdraw", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Run compliance check before processing withdrawal
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

        const wallet = walletResult.rows[0];
        // Verify sufficient balance exists
        if (wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Calculate new balance after deducting withdrawal
        const newBalance = Number(wallet.balance) - Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in the ledger for audit trail
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [merchantId, wallet.id, "withdraw", amount, newBalance]
        );

        res.json({ message: "Withdrawal successful", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Withdraw failed" });
    }
});

export default router;
