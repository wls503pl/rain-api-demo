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

// Registry of valid API Keys issued to merchants
// In production: replace with database lookup
const validApiKeys = new Set<string>();

/**
 * Register a new API Key when a merchant signs up
 * Called by the merchant onboarding endpoint
 */
export function registerApiKey(key: string) {
    validApiKeys.add(key);
}

/**
 * Middleware function: Validate API Key on every protected request
 *
 * Checks:
 * 1. X-API-Key header exists and is a string
 * 2. API Key exists in the registry (belongs to a registered merchant)
 *
 * If valid: Allow request to proceed (call next())
 * If invalid: Return 401 (Missing) or 403 (Invalid) error
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers["x-api-key"];

    // Check if API Key is provided
    if (!apiKey || typeof apiKey !== "string") {
        return res.status(401).json({ error: "Missing API Key" });
    }

    // Check if API Key belongs to a registered merchant
    if (!validApiKeys.has(apiKey)) {
        return res.status(403).json({ error: "Invalid API Key" });
    }

    // Merchant is authenticated, proceed to next middleware/route handler
    next();
}
