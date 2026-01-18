// ============================================================================
// FILE: db.ts
// PURPOSE: Database connection and query helper
// ============================================================================

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("DB CONFIG CHECK:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
});

// Create connection pool to PostgreSQL
// Connection pooling = reuse connections instead of creating new ones each time
// This makes database access faster and more efficient
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD ?? "", // Empty string if no password set
    database: process.env.DB_NAME || "payfi",
    port: 5432,
});

// Test connection when server starts
// Prints success/error message to console
pool.connect()
    .then((client) => {
        console.log("PostgreSQL connected successfully");
        client.release();
    })
    .catch((err) => {
        console.error("PostgreSQL connection failed:", err.message);
    });

// Helper function to run SQL queries
// Parameters are separated to prevent SQL injection attacks
// Example: query("SELECT * FROM merchants WHERE id = $1", [123])
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};
