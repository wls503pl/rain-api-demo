# Database Setup Guide (PostgreSQL)

This document describes the database layer used in the PayFi Platform project, why PostgreSQL was chosen, how to install it, common pitfalls encountered during setup, the required schema, and how to verify that the system is correctly deployed.

---

## Why PostgreSQL?

PayFi simulates a real-world fintech infrastructure (inspired by Rain, Stripe, Circle, etc.). For this reason, the database choice is not arbitrary.

From a **financial infrastructure perspective**, PostgreSQL is preferred because:

-   **ACID compliance** – Guarantees correctness of balances and transactions
-   **Strong transactional guarantees** – Critical for ledger systems
-   **Row-level locking** – Prevents race conditions on balances
-   **Rich constraint system** – Protects data integrity (foreign keys, uniqueness, etc.)
-   **Widely used in fintech** – Common in payment companies, exchanges, and banks
-   **Excellent tooling** – Debuggable via SQL, logs, CLI, and GUI tools

---

## Environment

This project is developed under:

-   OS: Ubuntu 22.04
-   Runtime: Node.js + TypeScript
-   DB: PostgreSQL 14+
-   Driver: `pg` (node-postgres)

---

## Installation

Run these commands inside your WSL Ubuntu terminal:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Start the service:

```bash
sudo service postgresql start
```

Switch to the postgres user:

```bash
sudo -u postgres psql
```

You should now see:

```
postgres=#
```

---

## Create Database

Inside psql:

```sql
CREATE DATABASE payfi;
```

Connect to it:

```sql
\c payfi
```

You should see:

```
You are now connected to database "payfi".
```

---

## Set Database Password (Important)

PostgreSQL requires a string password when using SCRAM authentication.

Run inside psql:

```sql
ALTER USER postgres WITH PASSWORD 'postgres123';
```

Expected output:

```
ALTER ROLE
```

This password must match your `.env` file.

---

## Environment Variables (.env)

Create a file at project root:

```
.env
```

Example content:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=payfi
DB_PORT=5432
```

The project uses `dotenv` to load this configuration.

---

## Required Tables

The project uses the following tables:

```sql
merchants
wallets
api_keys
transactions
cards
```

You can verify tables using:

```sql
\dt
```

Expected output:

```
 Schema |     Name     | Type  |  Owner
--------+--------------+-------+----------
 public | api_keys     | table | postgres
 public | cards        | table | postgres
 public | merchants    | table | postgres
 public | transactions | table | postgres
 public | wallets      | table | postgres
```

These tables support:

-   Merchant onboarding
-   Wallet isolation
-   Ledger-based accounting
-   Transfers
-   Card issuance simulation

---

## Common Setup Issues & Fixes

### 1. Error: client password must be a string

Cause:

-   DB_PASSWORD missing or undefined
-   .env not loaded
-   Password not configured in PostgreSQL

Fix:

-   Ensure `.env` exists
-   Ensure password is not empty
-   Run:

```sql
ALTER USER postgres WITH PASSWORD 'postgres123';
```

---

### 2. dotenv module not found

Fix:

```bash
npm install dotenv
npm install --save-dev @types/dotenv
```

---

### 3. pg types not found

Fix:

```bash
npm install --save-dev @types/pg
```

---

## How to Verify Deployment

Run the backend:

```bash
npm run dev
```

Expected output:

```
PayFi API running at http://localhost:3000
PostgreSQL connected successfully
```

This confirms:

-   Environment loaded correctly
-   PostgreSQL reachable
-   Credentials valid
-   DB connection pool healthy
