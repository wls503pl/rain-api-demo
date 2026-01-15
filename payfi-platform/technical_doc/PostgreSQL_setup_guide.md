# Database Guide (for PayFi / Rain-style Backend)

This document explains the database choices, setup, schema, and verification steps for the current backend project (Node.js + Express + TypeScript). It is designed to be committed to GitHub as part of the project documentation.

---

## 1. Database Choice

**Selected Database:** PostgreSQL

### Why PostgreSQL (from a financial product perspective)

From the perspective of building infrastructure for financial clients (merchants, wallets, balances, API keys, transactions), PostgreSQL is a strong default choice:

-   **Strong consistency (ACID compliance)**  
     Financial data (balances, transactions, settlements) must be accurate. PostgreSQL guarantees atomicity and consistency even under concurrent load.

-   **Mature ecosystem**  
     Widely used in fintech, supported by almost every ORM and migration tool, easy to hire for.

-   **Advanced constraints & integrity**  
     Foreign keys, unique constraints, check constraints, and transactions help prevent logical errors (e.g. negative balances, duplicate API keys).

-   **Scales well enough for early and mid stage**  
     Can handle millions of rows and high concurrency before needing complex infrastructure.

-   **Auditability**  
     Easy to add timestamps, immutable transaction tables, and audit logs – important for compliance-style systems.

> In short: PostgreSQL is not just convenient, it is aligned with how real financial systems are built.

---

## 2. Installation

### macOS (Homebrew)

```bash
brew install postgresql
brew services start postgresql
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Verify installation

```bash
psql --version
```

You should see something like:

```
psql (PostgreSQL) 14.x
```

---

## 3. Create Database & User

Enter PostgreSQL shell:

```bash
psql postgres
```

Create a database and user for the project:

```sql
CREATE DATABASE rain_dev;

CREATE USER rain_user WITH PASSWORD 'strong_password_here';

ALTER ROLE rain_user SET client_encoding TO 'utf8';
ALTER ROLE rain_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE rain_user SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE rain_dev TO rain_user;
```

---

## 4. Project Connection (Environment Variables)

Example `.env` configuration:

```env
DATABASE_URL=postgresql://rain_user:strong_password_here@localhost:5432/rain_dev
```

Typical libraries that work well with PostgreSQL in this stack:

-   Prisma
-   TypeORM
-   Knex
-   Sequelize

(Use whichever the project already integrates with.)

---

## 5. Core Tables (Current Project Scope)

Based on the implemented features (merchants, API keys, wallets), the minimal schema looks like this.

> These are logical definitions. Exact implementation may vary slightly depending on ORM/migration tool.

### merchants

Represents a business using the API.

| Column     | Type      | Notes         |
| ---------- | --------- | ------------- |
| id         | UUID      | Primary key   |
| name       | TEXT      | Merchant name |
| email      | TEXT      | Unique        |
| created_at | TIMESTAMP | Default now() |

---

### api_keys

Used for authenticating requests.

| Column      | Type      | Notes                             |
| ----------- | --------- | --------------------------------- |
| id          | UUID      | Primary key                       |
| merchant_id | UUID      | FK → merchants.id                 |
| key_hash    | TEXT      | Store hashed key, never plaintext |
| created_at  | TIMESTAMP | Default now()                     |
| revoked_at  | TIMESTAMP | Nullable                          |

> Security principle: API keys must be hashed before storing.

---

### wallets

Represents a ledger container for balances.

| Column      | Type      | Notes                  |
| ----------- | --------- | ---------------------- |
| id          | UUID      | Primary key            |
| merchant_id | UUID      | FK → merchants.id      |
| currency    | TEXT      | e.g. USD, USDC         |
| balance     | NUMERIC   | Use NUMERIC, not float |
| created_at  | TIMESTAMP | Default now()          |

> Using NUMERIC avoids floating point precision issues common in financial systems.

---

## 6. Common Pitfalls Encountered (and Solutions)

### 1. Connection refused / cannot connect to database

**Cause:** PostgreSQL service not running  
**Fix:**

```bash
brew services start postgresql
# or
sudo systemctl start postgresql
```

---

### 2. Authentication failed for user

**Cause:** Wrong password or user privileges  
**Fix:** Re-check user and permissions:

```sql
ALTER USER rain_user WITH PASSWORD 'new_password';
GRANT ALL PRIVILEGES ON DATABASE rain_dev TO rain_user;
```

---

### 3. Decimal precision bugs

**Cause:** Using FLOAT instead of NUMERIC for balances  
**Fix:** Always use `NUMERIC` / `DECIMAL` for money-related fields.

---

## 7. How to Verify Deployment is Successful

You can consider the database setup successful when:

1. The backend server starts without database errors
2. You can successfully:
    - Create a merchant
    - Generate an API key
    - Create a wallet
    - Fetch wallet data from the API
3. Manual verification via psql works:

```bash
psql postgresql://rain_user:password@localhost:5432/rain_dev
```

Then:

```sql
\dt
SELECT * FROM merchants LIMIT 5;
SELECT * FROM wallets LIMIT 5;
```

If data appears correctly, your DB layer is functional.

---

## 8. Recommended Next Step (Production Readiness)

If this project evolves toward real-world usage, consider adding:

-   `transactions` table (immutable ledger)
-   Row-level audit logs
-   Database migrations (if not already used)
-   Read-only replicas (later stage)
-   Encrypted fields for sensitive data
-   Backups (daily snapshots)

This moves the architecture closer to real fintech backend standards.

---

## Summary

PostgreSQL provides a strong, realistic foundation for a PayFi-style backend.  
The current schema supports merchants, authentication, and wallets while leaving room to expand toward transaction systems and financial-grade infrastructure.

This setup is suitable for both learning and demonstrating production-aligned engineering practices in a public GitHub repository.
