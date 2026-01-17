// ============================================================================
// FILE: server.ts
// PURPOSE: Express server initialization and route registration
// ============================================================================

/**
 * PayFi Platform - Main Server
 *
 * Initializes Express application, registers middleware, routes,
 * and starts the API server on port 3000.
 *
 * Architecture Overview:
 * - Public Endpoints (no auth): /health, /api/merchants
 * - Protected Endpoints (auth required): /api/wallets, /api/cards, /api/compliance
 *
 * Middleware Stack:
 * 1. express.json() - Parse incoming JSON requests
 * 2. apiKeyAuth - Validate API key for protected routes
 * 3. Route handlers - Business logic for each endpoint
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import apiKeyAuth from "./middleware/auth";
import merchantRoutes from "./routes/merchants";
import walletRoutes from "./routes/wallets";
import cardRoutes from "./routes/cards";
import complianceRoutes from "./routes/compliance";

const app = express();

// Global Middleware: Parse incoming request bodies as JSON
app.use(express.json());

/**
 * GET /health
 *
 * Health check endpoint - no authentication required.
 * Used by load balancers and monitoring systems to verify service is running.
 *
 * Response:
 * {
 *   "status": "ok",
 *   "service": "PayFi API"
 * }
 *
 * HTTP: 200 OK
 */
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "PayFi API" });
});

/**
 * GET /api/protected
 *
 * Demo protected endpoint - requires API key authentication.
 * Proves that the apiKeyAuth middleware works correctly.
 * Used for testing authentication before deploying protected routes.
 *
 * Authentication: Required (X-API-Key header)
 *
 * Response:
 * {
 *   "message": "You have access to protected resource"
 * }
 *
 * HTTP: 200 OK (if authenticated)
 * HTTP: 401 (missing API key)
 * HTTP: 403 (invalid API key)
 *
 * Test Command:
 * curl -X GET http://localhost:3000/api/protected \
 *   -H "X-API-Key: YOUR_MERCHANT_API_KEY"
 */
app.get("/api/protected", apiKeyAuth, (req, res) => {
    res.json({ message: "You have access to protected resource" });
});

/**
 * Merchant Routes
 *
 * POST /api/merchants - Create new merchant account (public signup)
 *
 * No authentication required for signup.
 * Returns merchant ID and API key for future authenticated requests.
 */
app.use("/api", merchantRoutes);

/**
 * Wallet Routes
 *
 * All endpoints require API key authentication.
 *
 * Endpoints:
 * - POST /api/wallets - Create new wallet for merchant
 * - GET /api/wallets - List merchant's wallets
 * - POST /api/wallets/deposit - Add funds to wallet
 * - POST /api/wallets/withdraw - Remove funds from wallet
 *
 * All wallet operations are subject to KYC compliance limits.
 */
app.use("/api", walletRoutes);

/**
 * Card Routes
 *
 * All endpoints require API key authentication.
 *
 * Endpoints:
 * - POST /api/cards - Create new virtual card
 * - GET /api/cards - List merchant's cards
 * - POST /api/cards/spend - Deduct funds from wallet using card
 *
 * All card operations are subject to KYC compliance limits.
 */
app.use("/api", cardRoutes);

/**
 * Compliance Routes
 *
 * All endpoints require API key authentication.
 *
 * Endpoints:
 * - POST /api/compliance/set-kyc - Update merchant KYC verification level
 *
 * Changing KYC level affects transaction limits for all future operations.
 */
app.use("/api", complianceRoutes);

/**
 * Start Express Server
 *
 * Listens on port 3000 for incoming HTTP requests.
 * In production: Use environment variable for port configuration.
 * In production: Use process manager (PM2, systemd) for crash recovery.
 */
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
