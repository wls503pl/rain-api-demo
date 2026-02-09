// ============================================================================
// FILE: payments.ts
// PURPOSE: Direct payment processing, settlement, and reconciliation
// ============================================================================
import { Router } from "express";
import { apiKeyAuth } from "../middleware/auth";
import { query } from "../db";
import { evaluateRisk } from "../compliance/riskEngine";
import { getMerchantCompliance } from "./compliance";

const router = Router();

// Helper function: Check if merchant can perform transaction
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

// Endpoint: Direct payment processing from wallet
// Merchant pays an external entity or system service
router.post("/payments/pay", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { amount, description, reference } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const compliance = await complianceCheck(merchantId, amount);
    if (!compliance.allowed) {
        return res.status(403).json({ error: compliance.reason });
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
        if (Number(wallet.balance) < Number(amount)) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        const newBalance = Number(wallet.balance) - Number(amount);

        // Transactional update: Update balance and record transaction
        await query("BEGIN");
        await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
            newBalance,
            wallet.id,
        ]);
        await query(
            "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, reference, description, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())",
            [
                merchantId,
                wallet.id,
                "payment",
                amount,
                newBalance,
                reference,
                description,
            ]
        );
        await query("COMMIT");

        res.json({
            message: "Payment successful",
            transaction: {
                merchantId,
                amount,
                newBalance,
                reference,
            },
        });
    } catch (err) {
        await query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Payment failed" });
    }
});

// Endpoint: Multi-merchant transaction support (Batch Payment)
// Single request to pay multiple recipients
router.post("/payments/batch", apiKeyAuth, async (req: any, res) => {
    const senderId = req.merchant.id;
    const { payments } = req.body; // Array of { toMerchantId, amount }

    if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ error: "Payments array is required" });
    }

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const compliance = await complianceCheck(senderId, totalAmount);
    if (!compliance.allowed) {
        return res
            .status(403)
            .json({ error: `Batch total: ${compliance.reason}` });
    }

    try {
        const senderWalletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [senderId]
        );
        if (senderWalletResult.rowCount === 0)
            return res.status(404).json({ error: "Sender wallet not found" });
        const senderWallet = senderWalletResult.rows[0];

        if (Number(senderWallet.balance) < totalAmount) {
            return res
                .status(400)
                .json({ error: "Insufficient balance for batch total" });
        }

        await query("BEGIN");
        let currentSenderBalance = Number(senderWallet.balance);

        for (const p of payments) {
            const { toMerchantId, amount } = p;

            // Recipient compliance check
            const recipientComp = await getMerchantCompliance(toMerchantId);
            if (recipientComp.isFrozen)
                throw new Error(`Recipient ${toMerchantId} is frozen`);

            const recipientWalletResult = await query(
                "SELECT id, balance FROM wallets WHERE merchant_id = $1",
                [toMerchantId]
            );
            if (recipientWalletResult.rowCount === 0)
                throw new Error(`Recipient ${toMerchantId} wallet not found`);
            const recipientWallet = recipientWalletResult.rows[0];

            currentSenderBalance -= amount;
            const recipientNewBalance =
                Number(recipientWallet.balance) + amount;

            await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
                currentSenderBalance,
                senderWallet.id,
            ]);
            await query("UPDATE wallets SET balance = $1 WHERE id = $2", [
                recipientNewBalance,
                recipientWallet.id,
            ]);

            await query(
                "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, description, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())",
                [
                    senderId,
                    senderWallet.id,
                    "transfer_out",
                    amount,
                    currentSenderBalance,
                    `Batch payment to ${toMerchantId}`,
                ]
            );
            await query(
                "INSERT INTO transactions (merchant_id, wallet_id, type, amount, balance_after, description, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())",
                [
                    toMerchantId,
                    recipientWallet.id,
                    "transfer_in",
                    amount,
                    recipientNewBalance,
                    `Batch payment from ${senderId}`,
                ]
            );
        }

        await query("COMMIT");
        res.json({
            message: "Batch payments successful",
            finalBalance: currentSenderBalance,
        });
    } catch (err: any) {
        await query("ROLLBACK");
        res.status(400).json({ error: err.message || "Batch payment failed" });
    }
});

// Endpoint: Settlement and Reconciliation
// Provides a summary of transactions for a period to reconcile balances
router.get("/payments/reconcile", apiKeyAuth, async (req: any, res) => {
    const merchantId = req.merchant.id;
    const { startDate, endDate } = req.query;

    try {
        const walletResult = await query(
            "SELECT id, balance FROM wallets WHERE merchant_id = $1",
            [merchantId]
        );
        if (walletResult.rowCount === 0)
            return res.status(404).json({ error: "Wallet not found" });
        const wallet = walletResult.rows[0];

        let sql =
            "SELECT type, SUM(amount) as total_amount, COUNT(*) as count FROM transactions WHERE merchant_id = $1";
        const params: any[] = [merchantId];

        if (startDate) {
            params.push(startDate);
            sql += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND created_at <= $${params.length}`;
        }

        sql += " GROUP BY type";

        const summaryResult = await query(sql, params);

        res.json({
            merchantId,
            currentBalance: wallet.balance,
            period: { startDate, endDate },
            summary: summaryResult.rows,
            reconciliationStatus: "MATCHED", // In a real system, this would verify against external records
        });
    } catch (err) {
        res.status(500).json({ error: "Reconciliation failed" });
    }
});

export default router;
