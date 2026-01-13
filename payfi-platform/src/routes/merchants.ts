/**
 * Merchant Onboarding Routes
 *
 * Purpose: Allow external businesses to register as merchants and receive
 * API credentials (API Key) to access the payment platform.
 *
 * This is the entry point for all merchants joining the platform.
 */

import { registerApiKey } from "../middleware/auth";
import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory merchant storage (will migrate to database)
const merchants: any[] = [];

/**
 * POST /api/merchants
 *
 * Create a new merchant account
 *
 * Input: { name: "Merchant Name" }
 *
 * Process:
 * 1. Validate merchant name is provided
 * 2. Generate a unique, cryptographically secure API Key
 * 3. Register the API Key in the authentication system
 * 4. Store merchant record with their credentials
 * 5. Return merchant details (ID, name, API Key)
 *
 * Output: Merchant object with generated API Key
 */
router.post("/merchants", (req, res) => {
    const { name } = req.body;

    // Validation: merchant name is required
    if (!name) {
        return res.status(400).json({ error: "Merchant name is required" });
    }

    // Generate secure API Key (48 random hex characters = 192 bits of entropy)
    const apiKey = crypto.randomBytes(24).toString("hex");

    // Create merchant record
    const merchant = {
        id: merchants.length + 1,
        name,
        apiKey,
        createdAt: new Date(),
    };

    // Register this API Key so authentication middleware can validate it later
    registerApiKey(apiKey, merchant.id);

    // Store merchant
    merchants.push(merchant);

    // Return merchant credentials to client
    // (In production: send only API Key via secure channel, not response body)
    res.json({
        message: "Merchant created",
        merchant: {
            id: merchant.id,
            name: merchant.name,
            apiKey: merchant.apiKey,
        },
    });
});

export default router;
