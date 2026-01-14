/**
 * Wallet Management Routes
 *
 * Purpose:
 * Provide wallet infrastructure for merchants.
 * Wallets represent where funds are stored and tracked inside the platform.
 *
 * This system is the financial core for:
 * - Card balances
 * - Payments
 * - Transfers
 * - Account funding
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";

const router = Router();

// In-memory wallet storage (will migrate to database later)
export const wallets: any[] = [];

// In-memory ledger (transaction history)
export const transactions: any[] = [];

/**
 * POST /api/wallets
 *
 * Create a wallet for the authenticated merchant
 */
router.post("/wallets", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const wallet = {
        id: wallets.length + 1,
        merchantId: merchant.id,
        balance: 0,
        createdAt: new Date(),
    };

    wallets.push(wallet);

    res.json({
        message: "Wallet created successfully",
        wallet,
    });
});

/**
 * GET /api/wallets
 *
 * Get all wallets belonging to authenticated merchant
 */
router.get("/wallets", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const merchantWallets = wallets.filter((w) => w.merchantId === merchant.id);

    res.json({
        wallets: merchantWallets,
    });
});

/**
 * POST /api/wallets/deposit
 *
 * Add funds to wallet (simulate top-up / funding)
 *
 * Input: { amount: number }
 */
router.post("/wallets/deposit", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const wallet = wallets.find((w) => w.merchantId === merchant.id);

    if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
    }

    wallet.balance += amount;

    const tx = {
        id: transactions.length + 1,
        merchantId: merchant.id,
        walletId: wallet.id,
        type: "deposit",
        amount,
        balanceAfter: wallet.balance,
        createdAt: new Date(),
    };

    transactions.push(tx);

    res.json({
        message: "Deposit successful",
        wallet,
        transaction: tx,
    });
});

/**
 * POST /api/wallets/withdraw
 *
 * Deduct funds from wallet (simulate spending / payments)
 *
 * Input: { amount: number }
 */
router.post("/wallets/withdraw", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const wallet = wallets.find((w) => w.merchantId === merchant.id);

    if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
    }

    wallet.balance -= amount;

    const tx = {
        id: transactions.length + 1,
        merchantId: merchant.id,
        walletId: wallet.id,
        type: "withdraw",
        amount,
        balanceAfter: wallet.balance,
        createdAt: new Date(),
    };

    transactions.push(tx);

    res.json({
        message: "Withdrawal successful",
        wallet,
        transaction: tx,
    });
});

/**
 * GET /api/wallets/transactions
 *
 * View all ledger entries for current merchant
 */
router.get("/wallets/transactions", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const merchantTx = transactions.filter((t) => t.merchantId === merchant.id);

    res.json({
        transactions: merchantTx,
    });
});

/**
 * POST /api/wallets/transfer
 *
 * Transfer funds to another merchant
 *
 * Input: { toMerchantId: number, amount: number }
 */
router.post("/wallets/transfer", apiKeyAuth, (req: any, res) => {
    const sender = req.merchant;
    const { toMerchantId, amount } = req.body;

    if (!toMerchantId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const senderWallet = wallets.find((w) => w.merchantId === sender.id);
    const receiverWallet = wallets.find(
        (w) => w.merchantId === Number(toMerchantId)
    );

    if (!senderWallet) {
        return res.status(404).json({ error: "Sender wallet not found" });
    }

    if (!receiverWallet) {
        return res.status(404).json({ error: "Receiver wallet not found" });
    }

    if (senderWallet.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update balances
    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    // Record transactions
    const txOut = {
        id: transactions.length + 1,
        merchantId: sender.id,
        walletId: senderWallet.id,
        type: "transfer_out",
        amount,
        balanceAfter: senderWallet.balance,
        createdAt: new Date(),
    };

    const txIn = {
        id: transactions.length + 2,
        merchantId: receiverWallet.merchantId,
        walletId: receiverWallet.id,
        type: "transfer_in",
        amount,
        balanceAfter: receiverWallet.balance,
        createdAt: new Date(),
    };

    transactions.push(txOut, txIn);

    res.json({
        message: "Transfer successful",
        from: senderWallet,
        to: receiverWallet,
        transactions: [txOut, txIn],
    });
});

export default router;
