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

// Endpoint: Check a merchant wallet's status
// Returns merchant's id, wallet's id, balance, create time
router.get("/wallets", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        // Get merchant's wallet from database
        const result = await query(
            "SELECT id, merchant_id, balance, created_at FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        // Check if wallet exists
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        res.json({
            wallet: result.rows[0],
        });
    } catch {
        res.status(500).json({ error: "Failed to retrieve wallet" });
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

// Endpoint: Get merchant's transaction history
// Returns all transactions for the merchant's wallet
router.get("/wallets/transactions", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        // Get merchant's wallet first
        const walletResult = await query(
            "SELECT id FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        // Check if wallet exists
        if (walletResult.rows.length === 0) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const walletId = walletResult.rows[0].id;

        // Get all transactions for this wallet, ordered by newest first
        const transactionsResult = await query(
            "SELECT id, type, amount, balance_after, created_at FROM transactions WHERE wallet_id = $1 ORDER BY created_at ASC",
            [walletId]
        );

        res.json({
            transactions: transactionsResult.rows,
            count: transactionsResult.rows.length,
        });
    } catch {
        res.status(500).json({ error: "Failed to retrieve transactions" });
    }
});

// Endpoint: Transfer funds between merchants
// Moves money from sender's wallet to recipient's wallet
// Subject to KYC compliance limits and balance availability
router.post("/wallets/transfer", apiKeyAuth, async (req: any, res) => {
    const senderMerchantId = req.merchant.id;
    const { toMerchantId, amount } = req.body;

    // Validate input
    if (!toMerchantId || !amount) {
        return res
            .status(400)
            .json({ error: "toMerchantId and amount are required" });
    }

    if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (senderMerchantId === toMerchantId) {
        return res.status(400).json({ error: "Cannot transfer to yourself" });
    }

    // Check if sender can perform this transaction
    const compliance = await complianceCheck(senderMerchantId, amount);
    if (!compliance.allowed) {
        return res.status(403).json({ error: compliance.reason });
    }

    try {
        // Get sender's wallet
        const senderWalletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [senderMerchantId]
        );

        if (senderWalletResult.rows.length === 0) {
            return res.status(404).json({ error: "Sender wallet not found" });
        }

        const senderWallet = senderWalletResult.rows[0];

        // Check if sender has enough balance
        if (Number(senderWallet.balance) < Number(amount)) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Get recipient's wallet
        const recipientWalletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [toMerchantId]
        );

        if (recipientWalletResult.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Recipient wallet not found" });
        }

        const recipientWallet = recipientWalletResult.rows[0];

        // Check if recipient account is frozen
        const recipientCompliance = await getMerchantCompliance(toMerchantId);
        if (recipientCompliance.isFrozen) {
            return res
                .status(403)
                .json({ error: "Recipient account is frozen" });
        }

        // Check if recipient can receive this amount (KYC limits)
        const recipientRisk = await complianceCheck(toMerchantId, amount);
        if (!recipientRisk.allowed) {
            return res
                .status(403)
                .json({ error: `Recipient ${recipientRisk.reason}` });
        }

        // Calculate new balances
        const senderNewBalance = Number(senderWallet.balance) - Number(amount);
        const recipientNewBalance =
            Number(recipientWallet.balance) + Number(amount);

        // Update sender's balance
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            senderNewBalance,
            senderWallet.id,
        ]);

        // Update recipient's balance
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            recipientNewBalance,
            recipientWallet.id,
        ]);

        // Record sender's transaction (outgoing transfer)
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [
                senderMerchantId,
                senderWallet.id,
                "transfer_out",
                amount,
                senderNewBalance,
            ]
        );

        // Record recipient's transaction (incoming transfer)
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW())",
            [
                toMerchantId,
                recipientWallet.id,
                "transfer_in",
                amount,
                recipientNewBalance,
            ]
        );

        res.json({
            message: "Transfer successful",
            senderBalance: senderNewBalance,
            recipientBalance: recipientNewBalance,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Transfer failed" });
    }
});

export default router;
