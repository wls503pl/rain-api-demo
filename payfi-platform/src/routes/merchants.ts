// ============================================================================
// FILE: merchants.ts
// PURPOSE: Merchant onboarding and account creation
// ============================================================================

/**
 * Merchant Onboarding
 *
 * Public entry point for businesses to register as merchants on the platform.
 * Creates merchant account and issues API credentials for accessing the API.
 *
 * No authentication required - this is the signup endpoint.
 */

import { Router } from "express";
import crypto from "crypto";
import { query } from "../db";
import { registerApiKey } from "../middleware/auth";

const router = Router();

/**
 * POST /api/merchants
 *
 * Creates a new merchant account and generates API credentials.
 *
 * Authentication: None (public signup endpoint)
 *
 * Request Body:
 * {
 *   "name": "string" (required, business name)
 * }
 *
 * Response on Success:
 * {
 *   "message": "Merchant created",
 *   "merchant": {
 *     "id": number (unique merchant ID),
 *     "name": "string",
 *     "apiKey": "hex-string" (48 random bytes as hex)
 *   }
 * }
 *
 * Response on Missing Name:
 * {
 *   "error": "Merchant name is required"
 * }
 * HTTP: 400 Bad Request
 *
 * Response on Database Error:
 * {
 *   "error": "Failed to create merchant"
 * }
 * HTTP: 500 Internal Server Error
 *
 * Implementation Flow:
 * 1. Validate: name must be provided in request body
 * 2. Database: INSERT merchant record, get auto-generated ID
 * 3. Security: Generate cryptographically secure API key (24 random bytes)
 * 4. Database: INSERT API key linked to merchant ID
 * 5. Response: Return merchant ID, name, and API key
 *
 * Important Notes:
 * - API Key is generated once during signup and given to merchant
 * - Merchant must store this key securely (cannot be recovered if lost)
 * - API Key should be sent as X-API-Key header in all future requests
 * - In production, key should be hashed in database for security
 * - Merchant ID is auto-incrementing PRIMARY KEY
 */
router.post("/merchants", async (req, res) => {
    const { name } = req.body;

    // Validation: Merchant name is required
    if (!name) {
        return res.status(400).json({ error: "Merchant name is required" });
    }

    try {
        // Insert new merchant record into merchants table
        // Returns auto-generated ID and the name back
        const result = await query(
            "INSERT INTO merchants (name, created_at) VALUES ($1, NOW()) RETURNING id, name",
            [name]
        );

        const merchant = result.rows[0];

        // Generate cryptographically secure API key
        // 24 bytes = 192 bits of entropy, suitable for authentication token
        const apiKey = crypto.randomBytes(24).toString("hex");

        // Store the API key in api_keys table linked to this merchant
        // registerApiKey is from auth.ts middleware
        await registerApiKey(apiKey, merchant.id);

        // Return success response with merchant details
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
