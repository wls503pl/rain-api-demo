/**
 * API Key Authentication Middleware
 *
 * Purpose: Validate that incoming requests come from registered merchants
 * by checking the X-API-Key header against a registry of valid keys.
 *
 * This protects all downstream features (wallets, cards, payments) by ensuring
 * only authenticated merchants can access protected endpoints.
 */

import { Request, Response, NextFunction } from "express";

// Store API Key → merchantId mapping
// In production: replace with database lookup
const apiKeyRegistry = new Map<string, number>();

/**
 * Register a new API Key when a merchant signs up
 * Called by the merchant onboarding endpoint
 */
export function registerApiKey(key: string, merchantId: number) {
    apiKeyRegistry.set(key, merchantId);
}

/**
 * Middleware function: Validate API Key on every protected request
 *
 * Checks:
 * 1. X-API-Key header exists and is a string
 * 2. API Key exists in the registry (belongs to a registered merchant)
 *
 * If valid:
 * - Attach merchant info to req.merchant
 * - Allow request to proceed
 *
 * If invalid:
 * - Return 401 (Missing) or 403 (Invalid)
 */
export function apiKeyAuth(req: any, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];

    // Check if API Key is provided
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    // Check if API Key is registered
    const merchantId = apiKeyRegistry.get(apiKey);

    if (!merchantId) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    // Attach merchant identity to request (used by wallets.ts)
    req.merchant = {
        id: merchantId,
        apiKey,
    };

    next();
}

// Support both import styles:
// import apiKeyAuth from "..."
// import { apiKeyAuth } from "..."
export default apiKeyAuth;
