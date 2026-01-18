// ============================================================================
// FILE: wallets.ts
// PURPOSE: Manage merchant wallets and funds
// ============================================================================

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";
import { evaluateRisk } from "../compliance/riskEngine";
import { KYCLevel } from "../compliance/kycLevels";
import { getMerchantCompliance } from "./compliance";

const router = Router();

// Helper function: Check if merchant can perform transaction
// Verifies both frozen status and KYC limits
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

// Endpoint: Create new wallet for merchant
// Each merchant gets one wallet to hold funds
router.post("/wallets", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        // Insert new wallet with balance = 0
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

// Endpoint: Deposit funds into wallet
// Adds money to merchant's balance
// Subject to KYC compliance limits
router.post("/wallets/deposit", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Check if this transaction is allowed
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        // Get merchant's current wallet and balance
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
        const wallet = walletResult.rows[0];

        // Calculate new balance after deposit
        const newBalance = Number(wallet.balance) + Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in ledger (for audit trail)
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [merchantId, wallet.id, "deposit", amount, newBalance]
        );

        res.json({ message: "Deposit successful", balance: newBalance });
    } catch {
        res.status(500).json({ error: "Deposit failed" });
    }
});

// Endpoint: Withdraw funds from wallet
// Removes money from merchant's balance
// Subject to KYC compliance limits and balance availability
router.post("/wallets/withdraw", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

    // Check if this transaction is allowed
    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed)
        return res.status(403).json({ error: compliance.reason });

    try {
        // Get merchant's current wallet and balance
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
        const wallet = walletResult.rows[0];

        // Check if merchant has enough balance
        if (wallet.balance < amount)
            return res.status(400).json({ error: "Insufficient balance" });

        // Calculate new balance after withdrawal
        const newBalance = Number(wallet.balance) - Number(amount);

        // Update wallet balance in database
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record this transaction in ledger (for audit trail)
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
