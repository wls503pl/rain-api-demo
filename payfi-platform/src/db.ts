/**
 * PostgreSQL Database Connection
 *
 * This module initializes the database connection pool and provides
 * a shared query() helper for all services (auth, wallets, cards, ledger).
 *
 * This is the foundation of our persistent ledger system.
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/**
 * Debug environment loading (safe for local dev)
 */
console.log("DB CONFIG CHECK:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    passwordRaw: process.env.DB_PASSWORD,
    passwordType: typeof process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

/**
 * IMPORTANT:
 * pg requires password to ALWAYS be a string.
 * If undefined, we must force it to "".
 */
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "payfi",
    port: 5432,
});

/**
 * Test connection on startup
 */
pool.connect()
    .then((client) => {
        console.log("PostgreSQL connected successfully");
        client.release();
    })
    .catch((err) => {
        console.error("PostgreSQL connection failed:", err.message);
    });

/**
 * Export standard query helper
 */
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};
