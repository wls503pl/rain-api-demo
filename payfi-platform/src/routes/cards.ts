/**
 * Card Issuing Routes
 *
 * Purpose:
 * Simulate virtual card issuance and spending for merchants.
 * Cards are linked to merchant wallets.
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";

const router = Router();

// In-memory storage
const cards: any[] = [];

// NOTE: This shares the same wallets + transactions arrays pattern used in wallets.ts
// In real systems this would be a database or shared service

// Temporary imports (we will refactor later when adding DB/service layer)
import { wallets, transactions } from "./wallets";

/**
 * POST /api/cards
 *
 * Create a virtual card for the authenticated merchant
 */
router.post("/cards", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const card = {
        id: cards.length + 1,
        merchantId: merchant.id,
        cardNumber: `4242-4242-4242-${String(cards.length + 1).padStart(
            4,
            "0"
        )}`,
        status: "active",
        createdAt: new Date(),
    };

    cards.push(card);

    res.json({
        message: "Card created successfully",
        card,
    });
});

/**
 * GET /api/cards
 *
 * Get all cards belonging to the authenticated merchant
 */
router.get("/cards", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const merchantCards = cards.filter((c) => c.merchantId === merchant.id);

    res.json({ cards: merchantCards });
});

/**
 * POST /api/cards/spend
 *
 * Simulate a card transaction (deduct from wallet)
 *
 * Input: { amount: number }
 */
router.post("/cards/spend", apiKeyAuth, (req: any, res) => {
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

    // Deduct balance
    wallet.balance -= amount;

    // Record transaction
    const tx = {
        id: transactions.length + 1,
        merchantId: merchant.id,
        walletId: wallet.id,
        type: "card_spend",
        amount,
        balanceAfter: wallet.balance,
        createdAt: new Date(),
    };

    transactions.push(tx);

    res.json({
        message: "Card transaction approved",
        wallet,
        transaction: tx,
    });
});

export default router;
