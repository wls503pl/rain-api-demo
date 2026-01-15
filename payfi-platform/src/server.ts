/**
 * PayFi Platform - Main Server
 *
 * Purpose: Initialize Express app, register routes, and start the API server
 *
 * Architecture:
 * - /health: Public endpoint (no auth required) - service health check
 * - /api/protected: Protected endpoint (auth required) - demo authentication works
 * - /api/merchants: Merchant registration (no auth required) - entry point for new merchants
 * - /api/wallets: Wallet management (auth required) - merchant balance and fund storage
 * - /api/*: All other merchant endpoints (auth required) - future card, payment, webhook APIs
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import apiKeyAuth from "./middleware/auth";
import merchantRoutes from "./routes/merchants";
import walletRoutes from "./routes/wallets";
import cardRoutes from "./routes/cards";

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

/**
 * Register Wallet Routes
 *
 * These endpoints provide wallet infrastructure for merchants.
 * All wallet APIs require API key authentication.
 *
 * Examples:
 * - POST /api/wallets → Create wallet
 * - GET  /api/wallets → List wallets
 */
app.use("/api", walletRoutes);

/**
 * Register Card Routes
 *
 * These endpoints provide virtual card management for merchants.
 * All card APIs require API key authentication.
 *
 * Examples:
 * - POST /api/cards → Create card
 * - GET  /api/cards → List cards
 * - POST /api/cards/:id/transfer → Transfer funds
 */
app.use("/api", cardRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
