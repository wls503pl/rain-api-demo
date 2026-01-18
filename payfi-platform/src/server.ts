// ============================================================================
// FILE: server.ts
// PURPOSE: Initialize Express server and register routes
// ============================================================================

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import apiKeyAuth from "./middleware/auth";
import merchantRoutes from "./routes/merchants";
import walletRoutes from "./routes/wallets";
import cardRoutes from "./routes/cards";
import complianceRoutes from "./routes/compliance";

const app = express();

// Middleware: Parse JSON requests
app.use(express.json());

// Health check endpoint (no auth needed)
// Used by monitoring systems to check if server is running
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "PayFi API" });
});

// Demo protected endpoint (requires API key)
// Shows that authentication middleware works
app.get("/api/protected", apiKeyAuth, (req, res) => {
    res.json({ message: "You have access to protected resource" });
});

// Register all route handlers
app.use("/api", merchantRoutes); // Merchant signup
app.use("/api", walletRoutes); // Wallet operations
app.use("/api", cardRoutes); // Card operations
app.use("/api", complianceRoutes); // KYC management

// Start server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`PayFi API running at http://localhost:${PORT}`);
});
