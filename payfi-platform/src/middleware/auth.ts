// ============================================================================
// FILE: auth.ts
// PURPOSE: API Key authentication middleware for merchant verification
// ============================================================================

/**
 * Authentication & Authorization
 *
 * Protects all protected endpoints by verifying merchants via API keys.
 * Implements two-layer security:
 * 1. API key must exist in X-API-Key header
 * 2. API key must be registered in database and linked to a merchant
 *
 * This middleware is applied to all protected routes (/api/*) except
 * /api/merchants (public signup) and /health (status check).
 */

import { Request, Response, NextFunction } from "express";
import { query } from "../db";

/**
 * registerApiKey
 *
 * Stores a new API key in the database for a merchant.
 * Called during merchant onboarding to create their API credentials.
 *
 * Flow:
 * 1. Merchant signs up via POST /api/merchants
 * 2. System generates random API key
 * 3. This function stores it in api_keys table
 * 4. Merchant receives API key to use in future requests
 *
 * @param key - The API key string (typically hex-encoded random bytes)
 * @param merchantId - The merchant's unique identifier
 *
 * Database Effect:
 * INSERT INTO api_keys (merchant_id, key) VALUES (merchantId, key)
 */
export async function registerApiKey(key: string, merchantId: number) {
    await query("INSERT INTO api_keys (merchant_id, key) VALUES ($1, $2)", [
        merchantId,
        key,
    ]);
}

/**
 * apiKeyAuth
 *
 * Express middleware for validating API keys on protected requests.
 * Applied to all routes that require merchant authentication.
 *
 * Execution Order:
 * 1. Check if X-API-Key header exists and is a string
 * 2. Query database to find merchant associated with API key
 * 3. If found: attach merchant info to request and continue (next())
 * 4. If not found: return 403 Forbidden and stop processing
 *
 * Security Notes:
 * - Returns 401 if API key is missing (client error)
 * - Returns 403 if API key is invalid (authentication failure)
 * - Merchant info is attached to req.merchant for downstream use
 * - Should always use HTTPS in production to prevent key interception
 *
 * @param req - Express request object (augmented with req.merchant)
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function apiKeyAuth(req: any, res: Response, next: NextFunction) {
    // Extract API key from X-API-Key header (case-insensitive in Express)
    const apiKey = req.headers["x-api-key"];

    // Validation: API key must be provided and must be a string
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    // Database lookup: Find merchant associated with this API key
    const result = await query(
        "SELECT merchant_id FROM api_keys WHERE key = $1",
        [apiKey]
    );

    // If no match found, the API key is invalid or doesn't exist
    if (result.rowCount === 0) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    // Success: Attach merchant identity to request object
    // This allows downstream middleware and route handlers to access the merchant
    req.merchant = {
        id: result.rows[0].merchant_id,
        apiKey,
    };

    // Continue to next middleware/route handler
    next();
}

// Support both import styles: default import and named import
export default apiKeyAuth;
