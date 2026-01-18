// ============================================================================
// FILE: wallets.ts
// PURPOSE: Wallet management - deposits, withdrawals, and balance tracking
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
 * Checks if a merchant can perform a wallet transaction.
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

// wallet creation, deposit, withdraw routes remain mostly unchanged,
// just the complianceCheck now uses DB-backed KYC/frozen status

router.post("/wallets", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;
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

router.post("/wallets/deposit", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
        const wallet = walletResult.rows[0];
        const newBalance = Number(wallet.balance) + Number(amount);
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [merchantId, wallet.id, "deposit", amount, newBalance]
        );
        res.json({ message: "Deposit successful", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Deposit failed" });
    }
});

router.post("/wallets/withdraw", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
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
            [merchantId, wallet.id, "withdraw", amount, newBalance]
        );
        res.json({ message: "Withdrawal successful", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Withdraw failed" });
    }
});

export default router;
