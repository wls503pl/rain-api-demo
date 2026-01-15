/**
 * Card Issuing Routes
 *
 * Purpose: Simulate virtual card issuance and spending for merchants.
 *
 * Cards are linked to wallets and all operations persisted in PostgreSQL.
 */

import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";

const router = Router();

/**
 * POST /api/cards
 * Create a virtual card
 */
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
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to create card" });
    }
});

/**
 * GET /api/cards
 * List all cards for merchant
 */
router.get("/cards", apiKeyAuth, async (req: any, res) => {
    try {
        const merchantId = req.merchant.id;
        const result = await query(
            "SELECT * FROM cards WHERE merchant_id = $1 ORDER BY created_at ASC",
            [merchantId]
        );

        res.json({ cards: result.rows });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch cards" });
    }
});

/**
 * POST /api/cards/spend
 * Spend funds from card (deduct from wallet)
 */
router.post("/cards/spend", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount } = req.body;

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

        if (wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const newBalance = Number(wallet.balance) - Number(amount);

        // Update wallet balance
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);

        // Record transaction
        const txResult = await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
            [merchantId, wallet.id, "card_spend", amount, newBalance]
        );

        res.json({
            message: "Card transaction approved",
            wallet: { ...wallet, balance: newBalance },
            transaction: txResult.rows[0],
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Card spend failed" });
    }
});

export default router;
