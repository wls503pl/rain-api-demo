/**
 * PayFi Platform - Main Server
 *
 * Purpose: Initialize Express app, register routes, and start the API server
 *
 * Architecture:
 * - /health: Public endpoint (no auth required) - service health check
 * - /api/protected: Protected endpoint (auth required) - demo authentication works
 * - /api/merchants: Merchant registration (no auth required) - entry point for new merchants
 * - /api/*: All other merchant endpoints (auth required) - future wallet, card, payment APIs
 */

import express from "express";
import merchantRoutes from "./routes/merchants";
import { apiKeyAuth } from "./middleware/auth";

const app = express();

// Middleware: parse incoming JSON requests
app.use(express.json());

/**
 * Health Check Endpoint
 * Public endpoint - no authentication required
 * Used to verify the service is running
 */
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "PayFi API" });
});

/**
 * Protected Endpoint (Demo)
 * Requires valid API Key in X-API-Key header
 * Proves authentication middleware is working before protecting production endpoints
 *
 * Test:
 * curl -X GET http://localhost:3000/api/protected \
 *   -H "X-API-Key: YOUR_MERCHANT_API_KEY"
 */
app.get("/api/protected", apiKeyAuth, (req, res) => {
    res.json({ message: "You have access to protected resource" });
});

/**
 * Register Merchant Routes
 * POST /api/merchants: Create new merchant account
 */
app.use("/api", merchantRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
