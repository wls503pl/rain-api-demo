# PayFi Platform

A production-grade B2B payment infrastructure API designed to help fintech companies onboard merchants and manage stablecoin-backed payments at scale.

## What is PayFi?

PayFi is a simulated payment platform that demonstrates the core infrastructure patterns used by modern fintech companies like Rain, Stripe, and Circle. It provides merchants with:

- **Merchant Onboarding** — Self-service registration and API key generation
- **Wallet Management** — Isolated balance tracking per merchant with deposit/withdrawal capabilities
- **Fund Flow Control** — Real-time balance validation and transaction ledger
- **Payment Processing** — Foundation for card issuance and payment settlement
- **Webhook Infrastructure** — Event-driven notifications for transaction updates
- **Audit Trail** — Complete transaction history for compliance and reconciliation

## Why PayFi Matters

Payment infrastructure is foundational to fintech. Without it, you cannot:
- Know who is making requests (authentication)
- Prevent merchants from accessing each other's funds (isolation)
- Validate if a merchant has sufficient balance (risk management)
- Track money movement (auditability)
- Scale to serve thousands of merchants

PayFi solves these problems with a clean, extensible architecture.

## Core Features

### Phase 1-2: Merchant Integration & Authentication
- External businesses register once and receive API credentials
- API Key-based authentication secures all protected endpoints
- Merchant identity is attached to every request

### Phase 3: Wallet System  
- Each merchant automatically receives an isolated wallet
- Deposit funds (top-up mechanism)
- Withdraw funds with balance validation
- View complete transaction history
- Automatic prevention of overdrafts

### Phase 4: Card Issuing (Coming Soon)
- Virtual card provisioning per merchant
- Card spending against wallet balance
- Real-time balance deductions

### Phase 5: Payments (Coming Soon)
- Direct payment processing from wallet
- Settlement and reconciliation
- Multi-merchant transaction support

### Phase 6: Webhooks (Coming Soon)
- Event-driven architecture for real-time notifications
- Merchant receives updates on transaction state changes
- Reliable delivery with retry logic

### Phase 7: Polish (Coming Soon)
- Production-grade error handling
- Rate limiting and DDoS protection
- Comprehensive API documentation
- SDK support for common languages

## Architecture

```
┌─────────────────┐
│   Merchants     │
└────────┬────────┘
         │ (API Key Auth)
         ▼
┌─────────────────────────────┐
│   PayFi API Gateway         │
│  ├─ /merchants              │
│  ├─ /wallets                │
│  ├─ /wallets/deposit        │
│  ├─ /wallets/withdraw       │
│  ├─ /wallets/transactions   │
│  └─ (Future: /cards, /payments)
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Core Services             │
│  ├─ Authentication Layer    │
│  ├─ Ledger System           │
│  ├─ Balance Management      │
│  └─ Transaction History     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Data Storage              │
│  ├─ Merchant Accounts       │
│  ├─ Wallets                 │
│  ├─ Transactions            │
│  └─ API Keys                │
└─────────────────────────────┘
```

## Key Capabilities

### Merchant Isolation
Each merchant operates in a completely isolated context. Their API Key grants access only to their own wallets and transactions. This is critical for security and compliance.

### Balance Safety
Before any withdrawal or payment, the system validates sufficient balance. This prevents overdrafts and ensures merchants cannot spend money they don't have—a fundamental control for financial systems.

### Auditability
Every transaction is recorded with timestamp, amount, and resulting balance. This creates a complete paper trail for compliance, reconciliation, and fraud investigation.

### Scalability
The architecture is designed to support thousands of merchants across multiple regions without cross-contamination or performance degradation.

## Quick Start

### 1. Register a Merchant
```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp"}'
```

Response includes `merchantId` and `apiKey`.

### 2. View Merchant's Wallet
```bash
curl http://localhost:3000/api/wallets \
  -H "X-API-Key: YOUR_API_KEY"
```

### 3. Deposit Funds
```bash
curl -X POST http://localhost:3000/api/wallets/deposit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"amount": 1000}'
```

### 4. Withdraw Funds
```bash
curl -X POST http://localhost:3000/api/wallets/withdraw \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"amount": 100}'
```

### 5. View Transaction History
```bash
curl http://localhost:3000/api/wallets/transactions \
  -H "X-API-Key: YOUR_API_KEY"
```

## Technical Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for REST API
- **Database:** SQLite (can be upgraded to PostgreSQL)
- **Authentication:** API Key-based with registry lookup
- **Architecture:** Modular, service-oriented design

## Project Status

- ✅ Phase 1: Foundation (Server setup, health checks)
- ✅ Phase 2: Merchant Integration (Registration, API key auth)
- ✅ Phase 3: Wallet System (Balance tracking, deposits, withdrawals, ledger)
- 🔄 Phase 4: Card Issuing (In design)
- 🔄 Phase 5: Payments (In design)
- 🔄 Phase 6: Webhooks (In design)
- 🔄 Phase 7: Polish (In design)

## Why Build This?

Built as a learning project to understand payment infrastructure architecture and fintech fundamentals.
Understanding fintech infrastructure from first principles is essential for anyone working in payments, DeFi, or blockchain infrastructure roles.
By building PayFi, I will learn:

- How merchants interact with payment platforms
- Why API authentication and merchant isolation matter
- The importance of balance validation and risk controls
- How transaction ledgers enable auditability

## Repository

- **GitHub:** [github.com/wls503pl/rain-api-demo](https://github.com/wls503pl/rain-api-demo)
- **Documentation:** See `/technical_doc` folder for detailed architecture and implementation guides
