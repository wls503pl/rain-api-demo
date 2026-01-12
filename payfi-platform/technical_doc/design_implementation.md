# PayFi Platform - Technical Documentation

## Product Vision

Enable fintech companies to onboard merchants and issue digital payment infrastructure in minutes, not weeks. PayFi abstracts away the complexity of payment rails, wallet management, and card issuing—allowing businesses to focus on customer experience.

---

## Phase 1: Merchant Onboarding ✓

### Problem Solved

When merchants want to integrate with a payment provider, they need:

-   A simple way to register their business
-   Immediate access credentials (API Key)
-   Ability to make authenticated API calls

### Solution

PayFi provides a one-step merchant registration that automatically generates secure API credentials.

### How It Works

**Endpoint:** `POST /api/merchants`

**Request:**

```json
{
    "name": "Test Company"
}
```

**Response:**

```json
{
    "message": "Merchant created",
    "merchant": {
        "id": 1,
        "name": "Test Company",
        "apiKey": "9a8f3c2e7b1d4f..."
    }
}
```

### What This Enables

-   Merchants can self-onboard without manual KYC delays
-   Each merchant gets a unique API Key for authentication
-   Foundation for wallet creation and payment processing

---

## Architecture Overview

```
POST /api/merchants
    ↓
Generate secure API Key (crypto.randomBytes)
    ↓
Store merchant record in-memory (later: database)
    ↓
Return credentials to merchant
```

### Proof of Concept

**Merchant Onboarding Test:**
![Merchant Integration Success](../img/merchant_integration/merchant_onboarding.png)
