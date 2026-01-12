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
const wallets: any[] = [];

/**
 * POST /api/wallets
 *
 * Create a wallet for the authenticated merchant
 *
 * Headers:
 * - X-API-Key: merchant API key
 *
 * Process:
 * 1. Authenticate merchant using API Key
 * 2. Create a wallet linked to this merchant
 * 3. Initialize balance to 0
 * 4. Store wallet in memory
 *
 * Output:
 * - Wallet object (id, merchantId, balance)
 */
router.post("/wallets", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    // Create wallet object
    const wallet = {
        id: wallets.length + 1,
        merchantId: merchant.id,
        balance: 0, // All wallets start empty
        createdAt: new Date(),
    };

    // Store wallet
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
 *
 * Headers:
 * - X-API-Key: merchant API key
 *
 * Process:
 * 1. Authenticate merchant
 * 2. Filter wallets by merchantId
 * 3. Return wallet list
 */
router.get("/wallets", apiKeyAuth, (req: any, res) => {
    const merchant = req.merchant;

    const merchantWallets = wallets.filter((w) => w.merchantId === merchant.id);

    res.json({
        wallets: merchantWallets,
    });
});

export default router;
