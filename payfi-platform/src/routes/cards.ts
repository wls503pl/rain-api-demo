// ============================================================================
// FILE: cards.ts
// PURPOSE: Create and manage virtual cards
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";
import { evaluateRisk } from "../compliance/riskEngine";
import { KYCLevel } from "../compliance/kycLevels";
import { getMerchantCompliance } from "./compliance";

const router = Router();

// Helper function: Check if merchant can perform card transaction
async function complianceCheck(merchantId: number, amount: number) {
    // Get merchant's KYC level and frozen status
    const { kycLevel, isFrozen } = await getMerchantCompliance(merchantId);

    // If account is frozen, reject immediately
    if (isFrozen) return { allowed: false, reason: "ACCOUNT_FROZEN" };

    // Check if transaction amount is within KYC limits
    return evaluateRisk({
        merchantId,
        kycLevel,
        amount,
        dailyTotal: amount,
        recentTxCount: 1,
        recentAmounts: [amount],
    });
}

// Endpoint: Create new virtual card
// Merchant gets a card number to use for transactions
router.post("/cards", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    try {
        // Insert new card with random card number
        // Format: 4242-4242-4242-XXXX (test card format)
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

// Endpoint: List all cards for merchant
// Shows all cards owned by authenticated merchant
router.get("/cards", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        // Get all cards for this merchant from database
        const result = await query(
            "SELECT * FROM cards WHERE merchant_id = $1 ORDER BY created_at ASC",
            [merchantId]
        );
        res.json({ cards: result.rows });
    } catch {
        res.status(500).json({ error: "Failed to fetch cards" });
    }
});

// Endpoint: Spend funds using card
// Deducts money from merchant's wallet when card is used
// Subject to KYC compliance limits and wallet balance
router.post("/cards/spend", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Validate amount is positive
    if (!amount || amount <= 0)
        return res.status(400).json({ error: "Invalid amount" });

    // Check if this transaction is allowed
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        // Get merchant's wallet and current balance
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        // Check if wallet exists
        if (walletResult.rowCount === 0)
            return res.status(404).json({ error: "Wallet not found" });

        const wallet = walletResult.rows[0];

        // Check if wallet has enough balance
        if (wallet.balance < amount)
            return res.status(400).json({ error: "Insufficient balance" });

        // Calculate new balance after card spend
        const newBalance = Number(wallet.balance) - Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in ledger (for audit trail)
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
