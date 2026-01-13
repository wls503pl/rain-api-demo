# PayFi Platform

A production-grade B2B payment infrastructure API designed to help fintech companies onboard merchants and manage stablecoin-backed payments at scale.

## What is PayFi?

PayFi is a simulated payment platform that demonstrates the core infrastructure patterns used by modern fintech companies like Rain, Stripe, and Circle. It provides merchants with:

-   **Merchant Onboarding** – Self-service registration and API key generation
-   **Wallet Management** – Isolated balance tracking per merchant with deposit/withdrawal capabilities
-   **Fund Transfers** – Peer-to-peer transfers between merchants with real-time validation
-   **Fund Flow Control** – Real-time balance validation and transaction ledger
-   **Payment Processing** – Foundation for card issuance and payment settlement
-   **Webhook Infrastructure** – Event-driven notifications for transaction updates
-   **Audit Trail** – Complete transaction history for compliance and reconciliation

## Core Features

### Phase 1: Merchant Integration

-   External businesses register and receive API credentials
-   API Key-based authentication secures all protected endpoints
-   Merchant identity is attached to every request

### Phase 2: Wallet System

-   Each merchant automatically receives an isolated wallet
-   Deposit funds (top-up mechanism)
-   Withdraw funds with balance validation
-   Transfer funds to other merchants
-   View complete transaction history
-   Automatic prevention of overdrafts

### Phase 3: Card Issuing (Coming Soon)

-   Virtual card provisioning per merchant
-   Card spending against wallet balance
-   Real-time balance deductions

### Phase 4: Payments (Coming Soon)

-   Direct payment processing from wallet
-   Settlement and reconciliation
-   Multi-merchant transaction support

### Phase 5: Webhooks (Coming Soon)

-   Event-driven architecture for real-time notifications
-   Merchant receives updates on transaction state changes
-   Reliable delivery with retry logic

### Phase 6: Polish (Coming Soon)

-   Production-grade error handling
-   Rate limiting and DDoS protection
-   Comprehensive API documentation
-   SDK support for common languages

## Architecture

```
┌─────────────────────────┐
│   Merchants             │
└────────────┬────────────┘
             │ (API Key Auth)
             ▼
┌──────────────────────────────────────┐
│   PayFi API Gateway                  │
│  ├─ /merchants                        │
│  ├─ /wallets                          │
│  ├─ /wallets/deposit                  │
│  ├─ /wallets/withdraw                 │
│  ├─ /wallets/transfer                 │
│  ├─ /wallets/transactions             │
│  └─ (Future: /cards, /payments)       │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   Core Services                      │
│  ├─ Authentication Layer              │
│  ├─ Ledger System                     │
│  ├─ Balance Management                │
│  └─ Transaction History               │
└────────────┬──────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   Data Storage                        │
│  ├─ Merchant Accounts                 │
│  ├─ Wallets                           │
│  ├─ Transactions                      │
│  └─ API Keys                          │
└──────────────────────────────────────┘
```

## Key Capabilities

### Merchant Isolation

Each merchant operates in a completely isolated context. Their API Key grants access only to their own wallets and transactions.

### Balance Safety

Before any withdrawal or transfer, the system validates sufficient balance. This prevents overdrafts and ensures merchants cannot spend money they don't have.

### Merchant-to-Merchant Transfers

Merchants can transfer funds to other merchants with automatic validation of both wallets and real-time balance checking.

### Auditability

Every transaction is recorded with timestamp, amount, and resulting balance. This creates a complete paper trail for compliance and reconciliation.

### Scalability

The architecture is designed to support thousands of merchants without cross-contamination or performance degradation.

## Quick Start

### 1. Register Merchants

```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"Merchant 1"}'

curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"Merchant 2"}'
```

Response includes `merchantId` and `apiKey`.

### 2. Create Wallets

```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "X-API-Key: MERCHANT_1_API_KEY"

curl -X POST http://localhost:3000/api/wallets \
  -H "X-API-Key: MERCHANT_2_API_KEY"
```

### 3. Deposit Funds

```bash
curl -X POST http://localhost:3000/api/wallets/deposit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"amount": 100}'
```

### 4. Transfer Between Merchants

```bash
curl -X POST http://localhost:3000/api/wallets/transfer \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"toMerchantId": 2, "amount": 30}'
```

### 5. View Transaction History

```bash
curl http://localhost:3000/api/wallets/transactions \
  -H "X-API-Key: MERCHANT_1_API_KEY"
```

## Technical Stack

-   **Runtime:** Node.js with TypeScript
-   **Framework:** Express.js for REST API
-   **Database:** In-memory (migration to PostgreSQL planned)
-   **Authentication:** API Key-based with registry lookup
-   **Architecture:** Modular, service-oriented design

## Project Status

-   ✅ Phase 1: Merchant Integration (Registration, API key auth)
-   ✅ Phase 2: Wallet System (Balance tracking, deposits, withdrawals, transfers, ledger)
-   🔄 Phase 3: Card Issuing (In design)
-   🔄 Phase 4: Payments (In design)
-   🔄 Phase 5: Webhooks (In design)
-   🔄 Phase 6: Polish (In design)

## Repository

-   **GitHub:** [github.com/wls503pl/rain-api-demo](https://github.com/wls503pl/rain-api-demo)
-   **Documentation:** See `design_implementation.md` for detailed architecture and implementation guides
