/**
 * Merchant Onboarding Routes
 *
 * Purpose: Allow external businesses to register as merchants and receive
 * API credentials (API Key) to access the payment platform.
 *
 * Stores merchant info in PostgreSQL.
 */

import { Router } from "express";
import crypto from "crypto";
import { query } from "../db";
import { registerApiKey } from "../middleware/auth";

const router = Router();

/**
 * POST /api/merchants
 *
 * Create a new merchant account
 *
 * Input: { name: "Merchant Name" }
 * Output: { id, name, apiKey }
 */
router.post("/merchants", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Merchant name is required" });
    }

    try {
        // Insert merchant into DB
        const result = await query(
            "INSERT INTO merchants (name, created_at) VALUES ($1, NOW()) RETURNING id, name",
            [name]
        );

        const merchant = result.rows[0];

        // Generate API key
        const apiKey = crypto.randomBytes(24).toString("hex");

        // Save API key in api_keys table
        await registerApiKey(apiKey, merchant.id);

        res.json({
            message: "Merchant created",
            merchant: {
                id: merchant.id,
                name: merchant.name,
                apiKey,
            },
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to create merchant" });
    }
});

export default router;
