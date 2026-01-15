/**
 * Wallet Management Routes
 *
 * Purpose: Provide wallet infrastructure for merchants.
 *
 * Operations:
 * - Create wallet
 * - Deposit / Withdraw
 * - Transfer between merchants
 * - View transaction history
 *
 * All data persisted in PostgreSQL.
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";

const router = Router();

/**
 * POST /api/wallets
 * Create a wallet for the authenticated merchant
 */
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
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to create wallet" });
    }
});

/**
 * GET /api/wallets
 * Get all wallets for authenticated merchant
 */
router.get("/wallets", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;

        const result = await query(
            "SELECT id, merchant_id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        res.json({ wallets: result.rows });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch wallets" });
    }
});

/**
 * POST /api/wallets/deposit
 * Add funds to wallet
 * Input: { amount: number }
 */
router.post("/wallets/deposit", apiKeyAuth, async (req: any, res) => {
    const { amount } = req.body;
    const merchantId = req.merchant.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    try {
        // Get wallet
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        if (walletResult.rowCount === 0) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const wallet = walletResult.rows[0];

        // Update balance
        const newBalance = Number(wallet.balance) + Number(amount);
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record transaction
        const txResult = await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
            [merchantId, wallet.id, "deposit", amount, newBalance]
        );

        res.json({
            message: "Deposit successful",
            wallet: { ...wallet, balance: newBalance },
            transaction: txResult.rows[0],
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Deposit failed" });
    }
});

/**
 * POST /api/wallets/withdraw
 * Deduct funds from wallet
 */
router.post("/wallets/withdraw", apiKeyAuth, async (req: any, res) => {
    const { amount } = req.body;
    const merchantId = req.merchant.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    try {
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );

        if (walletResult.rowCount === 0) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const wallet = walletResult.rows[0];

        if (wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const newBalance = Number(wallet.balance) - Number(amount);

        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        const txResult = await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
            [merchantId, wallet.id, "withdraw", amount, newBalance]
        );

        res.json({
            message: "Withdrawal successful",
            wallet: { ...wallet, balance: newBalance },
            transaction: txResult.rows[0],
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Withdrawal failed" });
    }
});

/**
 * GET /api/wallets/transactions
 * List all transactions for merchant
 */
router.get("/wallets/transactions", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    try {
        const txResult = await query(
            "SELECT * FROM transactions WHERE merchant_id = $1 ORDER BY created_at ASC",
            [merchantId]
        );
        res.json({ transactions: txResult.rows });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

/**
 * POST /api/wallets/transfer
 * Transfer funds to another merchant
 */
router.post("/wallets/transfer", apiKeyAuth, async (req: any, res) => {
    const fromMerchantId = req.merchant.id;
    const { toMerchantId, amount } = req.body;

    if (!toMerchantId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        const senderResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [fromMerchantId]
        );
        const receiverResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [toMerchantId]
        );

        if (senderResult.rowCount === 0) {
            return res.status(404).json({ error: "Sender wallet not found" });
        }
        if (receiverResult.rowCount === 0) {
            return res.status(404).json({ error: "Receiver wallet not found" });
        }

        const senderWallet = senderResult.rows[0];
        const receiverWallet = receiverResult.rows[0];

        if (senderWallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const newSenderBalance = Number(senderWallet.balance) - Number(amount);
        const newReceiverBalance =
            Number(receiverWallet.balance) + Number(amount);

        // Update balances
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newSenderBalance,
            senderWallet.id,
        ]);
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newReceiverBalance,
            receiverWallet.id,
        ]);

        // Record transactions
        const txOut = await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
            [
                fromMerchantId,
                senderWallet.id,
                "transfer_out",
                amount,
                newSenderBalance,
            ]
        );
        const txIn = await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
            [
                toMerchantId,
                receiverWallet.id,
                "transfer_in",
                amount,
                newReceiverBalance,
            ]
        );

        res.json({
            message: "Transfer successful",
            from: { ...senderWallet, balance: newSenderBalance },
            to: { ...receiverWallet, balance: newReceiverBalance },
            transactions: [txOut.rows[0], txIn.rows[0]],
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Transfer failed" });
    }
});

export default router;
