// ============================================================================
// FILE: cards.ts
// PURPOSE: Virtual card management and card spending endpoints
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";

import { evaluateRisk } from "../compliance/riskEngine";
import { KYCLevel } from "../compliance/kycLevels";
import { getMerchantCompliance } from "./compliance";

const router = Router();

/**
 * complianceCheck
 *
 * Checks if a merchant can perform a card transaction.
 * Uses database-backed KYC/frozen status.
 */
async function complianceCheck(merchantId: number, amount: number) {
    const { kycLevel, isFrozen } = await getMerchantCompliance(merchantId);
    if (isFrozen) return { allowed: false, reason: "ACCOUNT_FROZEN" };

    return evaluateRisk({
        merchantId,
        kycLevel,
        amount,
        dailyTotal: amount,
        recentTxCount: 1,
        recentAmounts: [amount],
    });
}

// card creation, list, spend routes remain the same, using DB complianceCheck

router.post("/cards", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    try {
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

router.post("/cards/spend", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;
    if (!amount || amount <= 0)
        return res.status(400).json({ error: "Invalid amount" });

    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
        if (walletResult.rowCount === 0)
            return res.status(404).json({ error: "Wallet not found" });
        const wallet = walletResult.rows[0];
        if (wallet.balance < amount)
            return res.status(400).json({ error: "Insufficient balance" });

        const newBalance = Number(wallet.balance) - Number(amount);
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);
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
