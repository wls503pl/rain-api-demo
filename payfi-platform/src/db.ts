// ============================================================================
// FILE: db.ts
// PURPOSE: PostgreSQL database connection pool and query helper
// ============================================================================

/**
 * Database Connection Module
 *
 * Initializes and manages PostgreSQL connection pool.
 * Provides a centralized query() function used by all services
 * (auth, wallets, cards, merchants, transactions, compliance).
 *
 * This is the foundation of the persistent ledger system.
 * All data (merchants, wallets, cards, transactions) is stored here.
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/**
 * Database Configuration Debug Logging
 *
 * Logs database connection parameters on startup (safe for local dev).
 * Helps diagnose connection issues during development.
 *
 * In production: Remove or replace with secure logging (don't log credentials).
 */
console.log("DB CONFIG CHECK:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    passwordRaw: process.env.DB_PASSWORD,
    passwordType: typeof process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

/**
 * PostgreSQL Connection Pool
 *
 * Creates reusable database connection pool for performance.
 * Connection pooling prevents creating/closing connections for each query,
 * reducing latency and improving throughput.
 *
 * Configuration from environment variables:
 * - DB_HOST: Database server hostname (default: localhost)
 * - DB_USER: Database user (default: postgres)
 * - DB_PASSWORD: Database password (default: empty string)
 * - DB_NAME: Database name (default: payfi)
 * - Port: Always 5432 (PostgreSQL standard port)
 *
 * IMPORTANT SECURITY NOTE:
 * pg library requires password to ALWAYS be a string, never undefined.
 * We use "??" nullish coalescing to force empty string as default,
 * preventing "undefined" from being passed to the pool.
 */
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD ?? "", // Force empty string if undefined
    database: process.env.DB_NAME || "payfi",
    port: 5432, // Standard PostgreSQL port
});

/**
 * Test Database Connection on Startup
 *
 * Validates that database is reachable and credentials work.
 * Logs success/failure to console for troubleshooting.
 * Continues server startup regardless (connection pooling happens later as needed).
 *
 * In production: Consider exiting process if connection fails.
 */
pool.connect()
    .then((client) => {
        console.log("PostgreSQL connected successfully");
        client.release(); // Release test connection back to pool
    })
    .catch((err) => {
        console.error("PostgreSQL connection failed:", err.message);
        // In production: process.exit(1) to fail-fast
    });

/**
 * query() Helper Function
 *
 * Standard query helper exported to all services.
 * Wraps the connection pool for clean, consistent API.
 *
 * Usage in other modules:
 * import { query } from "../db"
 * const result = await query("SELECT * FROM merchants WHERE id = $1", [123])
 *
 * Parameters:
 * @param text - SQL query with numbered placeholders ($1, $2, etc.)
 * @param params - Array of values to substitute for placeholders
 *
 * Returns: Promise resolving to pg.QueryResult with:
 * - rows: Array of result rows
 * - rowCount: Number of rows returned/affected
 *
 * Security: Uses parameterized queries to prevent SQL injection
 */
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};
