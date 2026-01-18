// ============================================================================
// FILE: merchants.ts
// PURPOSE: Create merchant accounts and issue API keys
// ============================================================================

import { Router } from "express";
import crypto from "crypto";
import { query } from "../db";
import { registerApiKey } from "../middleware/auth";

const router = Router();

// Endpoint: Create new merchant account
// Public endpoint - no authentication required (signup)
// Returns merchant ID and API key
router.post("/merchants", async (req, res) => {
    const { name } = req.body;

    // Validate: merchant name must be provided
    if (!name) {
        return res.status(400).json({ error: "Merchant name is required" });
    }

    try {
        // Insert new merchant record in database
        // Returns auto-generated merchant ID
        const result = await query(
            "INSERT INTO merchants (name, created_at) VALUES ($1, NOW()) RETURNING id, name",
            [name]
        );

        const merchant = result.rows[0];

        // Generate random API key (24 bytes = 48 hex characters)
        // Merchants use this key to authenticate API requests
        const apiKey = crypto.randomBytes(24).toString("hex");

        // Store API key in database, linked to this merchant
        await registerApiKey(apiKey, merchant.id);

        // Return success response with merchant details
        res.json({
            message: "Merchant created",
            merchant: {
                id: merchant.id,
                name: merchant.name,
                apiKey, // Merchant must save this key
            },
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Failed to create merchant" });
    }
});

export default router;
