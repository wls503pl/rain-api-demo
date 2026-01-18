// ============================================================================
// FILE: auth.ts
// PURPOSE: API Key authentication for merchants
// ============================================================================

import { Request, Response, NextFunction } from "express";
import { query } from "../db";

// Store new API key in database
// Called when merchant signs up to create their credentials
// Merchant will use this key to authenticate future requests
export async function registerApiKey(key: string, merchantId: number) {
    await query("INSERT INTO api_keys (merchant_id, key) VALUES ($1, $2)", [
        merchantId,
        key,
    ]);
}

// Middleware: Check if merchant has valid API key
// This function runs before accessing protected endpoints
//
// How it works:
// 1. Get API key from X-API-Key header
// 2. Query database to check if this key exists
// 3. If valid: attach merchant info to request and continue
// 4. If invalid: reject request with 403 error
export async function apiKeyAuth(req: any, res: Response, next: NextFunction) {
    // Get API key from request header
    const apiKey = req.headers["x-api-key"];

    // Check if API key is provided and is a string
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    // Look up API key in database
    const result = await query(
        "SELECT merchant_id FROM api_keys WHERE key = $1",
        [apiKey]
    );

    // If not found, reject with 403 Forbidden
    if (result.rowCount === 0) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    // Success: attach merchant ID to request object
    // Downstream code can access this with req.merchant.id
    req.merchant = {
        id: result.rows[0].merchant_id,
        apiKey,
    };

    // Continue to next middleware/route handler
    next();
}

export default apiKeyAuth;
