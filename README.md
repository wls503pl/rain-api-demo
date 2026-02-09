# PayFi Platform

A production-grade B2B payment infrastructure API designed to help fintech companies onboard merchants and manage stablecoin-backed payments at scale.

## What is PayFi?

PayFi is a simulated payment platform that demonstrates the core infrastructure patterns used by modern fintech companies like Rain, Stripe, and Circle. It provides merchants with:

- **Merchant Onboarding** – Self-service registration and API key generation
- **Wallet Management** – Isolated balance tracking per merchant with deposit/withdrawal capabilities
- **Fund Transfers** – Peer-to-peer transfers between merchants with real-time validation
- **Fund Flow Control** – Real-time balance validation and transaction ledger
- **Card Issuing** – Virtual card provisioning with spending against wallet balance
- **KYC Compliance** – Risk engine with transaction limits based on verification levels
- **Account Freezing** – Immediate transaction lockdown for high-risk merchants
- **Audit Trail** – Complete transaction history for compliance and reconciliation

## Core Features

### Phase 1: Merchant Integration ✅

- External businesses register and receive API credentials
- API Key-based authentication secures all protected endpoints
- Merchant identity is attached to every request

### Phase 2: Wallet System ✅

- Each merchant automatically receives an isolated wallet
- Deposit funds (top-up mechanism)
- Withdraw funds with balance validation
- Transfer funds to other merchants
- View complete transaction history
- Automatic prevention of overdrafts

### Phase 3: Card Issuing ✅

- Virtual card provisioning per merchant
- Card spending against wallet balance
- Real-time balance deductions
- Transaction recording in ledger
- Automatic fraud prevention via balance validation

### Phase 4: KYC Compliance ✅

- Five-tier KYC verification levels (Unverified → VIP)
- Transaction limits based on merchant verification status
- Risk evaluation engine for compliance checking
- Real-time upgrade of KYC levels via API
- Transaction blocking for unverified merchants
- Complete audit trail of all blocked transactions

### Phase 4.1: Account Freezing ✅

- Immediate transaction lockdown for all merchants
- Blocks deposits, withdrawals, and card spending
- Applied before KYC limit checks
- Used for suspicious activity, regulatory compliance, and account takeover prevention
- Preserves all account data for audit trails

### Phase 5: Payment Processing ✅

- Direct merchant-to-merchant payment processing
- Single and batch payment endpoints with merchant license requirement
- Payment reconciliation with optional date-range filtering
- Complete transaction audit trail for settlements

### Phase 6: Webhooks (Coming Soon)

- Event-driven architecture for real-time notifications
- Merchant receives updates on transaction state changes
- Reliable delivery with retry logic

### Phase 7: Production Polish (Coming Soon)

- Enhanced error handling
- Rate limiting and DDoS protection
- Comprehensive API documentation
- SDK support for common languages

## Architecture

```
┌──────────────────────────────────────┐
│   Merchants                          │
└──────────────────────┬───────────────┘
             │ (API Key Auth)
             ▼
┌───────────────────────────────────────────────────────────────────┐
│   PayFi API Gateway                                               │
│  ├─ /merchants                                                    │
│  ├─ /wallets                                                      │
│  ├─ /wallets/deposit                                              │
│  ├─ /wallets/withdraw                                             │
│  ├─ /wallets/transfer                                             │
│  ├─ /wallets/transactions                                         │
│  ├─ /cards                                                        │
│  ├─ /cards/spend                                                  │
│  ├─ /payments/pay                                                 │
│  ├─ /payments/batch                                               │
│  ├─ /payments/reconcile                                           │
│  ├─ /compliance/set-kyc                                           │
│  ├─ /compliance/freeze                                            │
│  └─ (Future: /webhooks)                                           │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│   Core Services                                                   │
│  ├─ Authentication Layer (API Key validation)                     │
│  ├─ Risk Engine (KYC compliance & freezing)                       │
│  ├─ Ledger System (Transaction recording)                         │
│  ├─ Balance Management                                            │
│  └─ Transaction History                                           │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│   PostgreSQL Database                                             │
│  ├─ merchants table (id, name, kyc_level, is_frozen)              │
│  ├─ api_keys table                                                │
│  ├─ wallets table                                                 │
│  ├─ cards table                                                   │
│  └─ transactions table                                            │
└───────────────────────────────────────────────────────────────────┘
```

## Key Capabilities

### Merchant Isolation

Each merchant operates in a completely isolated context. Their API Key grants access only to their own wallets, cards, and transactions.

### Balance Safety

Before any withdrawal, transfer, or card spending, the system validates sufficient balance. This prevents overdrafts and ensures merchants cannot spend money they don't have.

### KYC-Enforced Limits

Transaction limits are dynamically enforced based on merchant KYC verification level. Unverified merchants are blocked from all transactions. Each level provides increasing transaction capacity.

| Level      | Max Single Tx | Max Balance | Use Case          |
| ---------- | ------------- | ----------- | ----------------- |
| Unverified | 0             | 0           | No transactions   |
| Basic      | 100           | 500         | Retail customers  |
| Standard   | 1,000         | 5,000       | Normal merchants  |
| Business   | 10,000        | 50,000      | Business entities |
| VIP        | 100,000       | 500,000     | Premium partners  |

### Account Freezing

Merchants with frozen accounts cannot perform any transactions (deposits, withdrawals, card spending). This is the highest level of transaction control and is applied immediately without any limit checks. Frozen accounts are used to contain high-risk or suspicious activity.

### Merchant-to-Merchant Transfers

Merchants can transfer funds to other merchants with automatic validation of both wallets and real-time balance checking.

### Virtual Card Management

Merchants can create and manage virtual cards tied directly to their wallets. Card spending immediately deducts from wallet balance with transaction recording.

### Auditability

Every transaction is recorded with timestamp, amount, type, and resulting balance. Failed transactions (compliance violations) are logged separately for regulatory review.

### Data Persistence

All data (merchants, API keys, wallets, cards, transactions) is persisted in PostgreSQL. The system survives restarts and supports horizontal scaling across multiple instances.

### Scalability

The architecture is designed to support thousands of merchants without cross-contamination or performance degradation.

## Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Environment variables configured

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

### 2. Verify KYC Enforcement (Unverified merchants blocked)

```bash
curl -X POST http://localhost:3000/api/wallets/deposit \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}'
```

Response: `{"error": "KYC_TX_LIMIT"}` (HTTP 403)

Reason: Default KYC level is Unverified (maxTx=0). All transactions blocked.

### 3. Upgrade KYC Level to Basic

```bash
curl -X POST http://localhost:3000/api/compliance/set-kyc \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"level":"Basic"}'
```

Response: `{"message": "KYC updated", "merchantId": 1, "level": "Basic"}`

Available levels: Unverified (0), Basic (100), Standard (1000), Business (10000), VIP (100000)

### 4. Deposit Funds (now allowed with Basic level)

```bash
curl -X POST http://localhost:3000/api/wallets/deposit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"amount": 100}'
```

Transaction is validated against merchant's KYC transaction limit.

### 5. Create Virtual Card

```bash
curl -X POST http://localhost:3000/api/cards \
  -H "X-API-Key: MERCHANT_1_API_KEY"
```

### 6. Spend with Card

```bash
curl -X POST http://localhost:3000/api/cards/spend \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"amount": 20}'
```

Card spend is subject to both KYC limits and available balance.

### 7. Transfer Between Merchants

```bash
curl -X POST http://localhost:3000/api/wallets/transfer \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"toMerchantId": 2, "amount": 30}'
```

### 8. Freeze a Merchant Account

```bash
UPDATE merchants SET is_frozen = true WHERE id = 2;
```

Once frozen, the merchant cannot deposit, withdraw, or spend:

```bash
curl -X POST http://localhost:3000/api/wallets/deposit \
  -H "X-API-Key: MERCHANT_2_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}'
```

Response: `{"error": "ACCOUNT_FROZEN"}` (HTTP 403)

### 9. Single Direct Payment

```bash
curl -X POST http://localhost:3000/api/payments/pay \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{"toMerchantId": 2, "amount": 50, "description": "Payment", "reference": "INV-001"}'
```

Processes a payment from Merchant 1 to Merchant 2. Requires merchant license.

### 10. Batch Payments

```bash
curl -X POST http://localhost:3000/api/payments/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: MERCHANT_1_API_KEY" \
  -d '{
    "payments": [
      {"toMerchantId": 2, "amount": 100},
      {"toMerchantId": 3, "amount": 50}
    ]
  }'
```

Processes multiple payments in a single request. All succeed or all fail atomically.

### 11. Payment Reconciliation

```bash
curl http://localhost:3000/api/payments/reconcile \
  -H "X-API-Key: MERCHANT_1_API_KEY"
```

Retrieves complete transaction history and balance verification.

**With date range:**

```bash
curl "http://localhost:3000/api/payments/reconcile?startDate=2023-01-01&endDate=2023-12-31" \
  -H "X-API-Key: MERCHANT_1_API_KEY"
```

### 12. View Transaction History

```bash
curl http://localhost:3000/api/wallets/transactions \
  -H "X-API-Key: MERCHANT_1_API_KEY"
```

## Technical Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for REST API
- **Database:** PostgreSQL 12+ for persistent storage
- **Authentication:** API Key-based with database validation
- **Compliance:** Risk engine with KYC-based transaction limits and account freezing
- **Architecture:** Modular, service-oriented design

## Project Status

- ✅ Phase 1: Merchant Integration (Registration, API key auth)
- ✅ Phase 2: Wallet System (Balance tracking, deposits, withdrawals, transfers, ledger)
- ✅ Phase 3: Card Issuing (Virtual cards, card spending, balance validation)
- ✅ Phase 4: KYC Compliance (Risk engine, transaction limits, verification levels)
- ✅ Phase 4.1: Account Freezing (Immediate transaction lockdown)
- ✅ Phase 5: Payment Processing (Direct payments, batch payments, reconciliation)
- 🔄 Phase 6: Webhooks (In design)
- 🔄 Phase 7: Production Polish (In design)

## Documentation

- **Technical Implementation:** See **[Design_Implementation](./payfi-platform/technical_doc/design_implementation.md)** for detailed architecture patterns, KYC testing flows, account freezing mechanics, and step-by-step guides
- **Database Setup:** See **[PostgreSQL_Setup](./payfi-platform/technical_doc/PostgreSQL_setup_guide.md)** for PostgreSQL installation, schema definitions, and troubleshooting
