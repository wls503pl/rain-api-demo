# PayFi Platform - Technical Documentation

## Overview

This is a personal learning project to understand Rain's payment infrastructure architecture, specifically their merchant integration, wallet management, fiat-to-stablecoin flows, card issuing, and webhook systems. Built as a reference implementation for studying fintech infrastructure patterns.

---

# Phase 1: Merchant Integration

## Why Create Merchants?

For a payment platform to function, external businesses need a way to join and access APIs. A merchant is simply a registered business that can make authenticated requests to the platform.

Without merchant registration, there's no entry point for businesses to use the payment infrastructure.

## Implementation: Merchant Registration

Create file structure:

```
mkdir src/routes
touch src/routes/merchants.ts
```

This file handles the merchant registration endpoint. When a business signs up, the system generates their API Key and stores their account.

**Test the endpoint:**

```bash
curl -X POST http://localhost:3000/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Company"}'
```

**Success:** You receive a response with the merchant's generated API Key.

---

## Why API Key Authentication?

Once merchants register, the platform must verify every request actually comes from that merchant. An API Key acts as credentials—like a username/password, but for automated systems.

Without authentication, anyone could pretend to be a merchant and access their wallets or issue cards on their behalf.

## Implementation: Authentication Middleware

Create file:

```
mkdir src/middleware
touch src/middleware/auth.ts
```

This file contains two functions:

-   `registerApiKey()`: Stores a newly generated API Key when a merchant signs up
-   `apiKeyAuth()`: Middleware that checks if incoming requests have a valid API Key

Update `src/server.ts` to import the authentication middleware and create a protected test endpoint.

**Test authentication using the API Key from merchant registration:**

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

Replace `YOUR_API_KEY_HERE` with the actual API Key you received from the merchant registration response.

**Example:**
![API Key Authentication Test](../img/merchant_integration/access_protected_endpoint.png)

**Success:** You see the message "You have access to protected resource"

**Failure (without API Key or with invalid key):** You get a 401 or 403 error.

---

## What This Enables

-   Merchants can only access resources they own
-   All future features (wallets, cards, payments) can assume requests are from authenticated merchants
-   The platform has a security foundation for all protected endpoints
