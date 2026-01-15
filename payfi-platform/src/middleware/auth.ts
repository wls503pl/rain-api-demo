/**
 * API Key Authentication Middleware
 *
 * Purpose:
 * Validate that incoming requests come from registered merchants
 * by checking the X-API-Key header against the api_keys table in PostgreSQL.
 *
 * This protects all downstream features (wallets, cards, payments) by ensuring
 * only authenticated merchants can access protected endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { query } from "../db";

/**
 * Register a new API Key when a merchant signs up
 *
 * Called by the merchant onboarding endpoint.
 * Stores the API key in the database linked to the merchant.
 */
export async function registerApiKey(key: string, merchantId: number) {
    await query("INSERT INTO api_keys (merchant_id, key) VALUES ($1, $2)", [
        merchantId,
        key,
    ]);
}

/**
 * Middleware function: Validate API Key on every protected request
 *
 * Checks:
 * 1. X-API-Key header exists
 * 2. API Key exists in database
 *
 * If valid:
 * - Attach merchant info to req.merchant
 * - Allow request to proceed
 *
 * If invalid:
 * - Return 401 (Missing) or 403 (Invalid)
 */
export async function apiKeyAuth(req: any, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];

    // Check if API Key is provided
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    // Look up API Key in database
    const result = await query(
        "SELECT merchant_id FROM api_keys WHERE key = $1",
        [apiKey]
    );

    if (result.rowCount === 0) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    // Attach merchant identity to request (used by wallets.ts, cards.ts)
    req.merchant = {
        id: result.rows[0].merchant_id,
        apiKey,
    };

    next();
}

// Support both import styles:
// import apiKeyAuth from "..."
// import { apiKeyAuth } from "..."
export default apiKeyAuth;
