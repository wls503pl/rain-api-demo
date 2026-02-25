# Payment Industry — Core Concepts Overview

> This document covers the complete mainstream payment lifecycle and supporting concepts used in card-based payment systems (Visa / Mastercard model).
> Topics: **Four-Party Model · Authorization · Capture · Clearing · Settlement · Void/Reversal · Refund · Chargeback · Interchange · PSP · 3DS · Tokenization**

---

## Part I — The Four-Party Model (四方支付模型)

---

### § 1 — Overview of the Four Parties

Card payments do not happen between two parties. Every transaction involves four distinct roles connected through a card network:

```
Cardholder ──▶ Merchant ──▶ Acquirer ──▶ Card Network ──▶ Issuer
   (买家)        (商户)      (收单行)      (卡组织)         (发卡行)
```

| Party            | Chinese | Role                                                                                 |
| ---------------- | ------- | ------------------------------------------------------------------------------------ |
| **Cardholder**   | 持卡人  | Initiates the payment using a card issued by their bank                              |
| **Merchant**     | 商户    | Accepts the card and initiates the authorization request                             |
| **Acquirer**     | 收单行  | The merchant's bank; routes transactions to the network                              |
| **Card Network** | 卡组织  | The rails (Visa, Mastercard, UnionPay); sets rules, routes messages, calculates fees |
| **Issuer**       | 发卡行  | The cardholder's bank; approves or declines, moves funds                             |

> ⚠️ "Four-party" counts Cardholder, Merchant, Acquirer, and Issuer. The Card Network is the infrastructure connecting them — sometimes called the "scheme."

---

### § 2 — Responsibilities and Information Flow

**Authorization flow (request direction):**

```
Cardholder
    │  swipes / taps / enters card
    ▼
Merchant (POS / Payment Gateway)
    │  sends ISO 8583 auth request
    ▼
Acquirer
    │  routes to network
    ▼
Card Network (Visa / Mastercard)
    │  routes to issuer
    ▼
Issuer
    │  checks: funds available? fraud risk? card valid?
    │  returns: Approve (00) or Decline (05, 51, etc.)
    ▼
Card Network ──▶ Acquirer ──▶ Merchant ──▶ Cardholder
```

**Fund flow direction (settlement):**

```
Cardholder's account (Issuer)
    │  funds deducted (net of interchange)
    ▼
Card Network
    │  distributes net funds
    ▼
Acquirer
    │  deposits (net of acquirer fees)
    ▼
Merchant's bank account
```

**Key insight:** Information flows both ways through the network in real time; money only flows one way, and only during settlement.

---

### § 3 — Who Sets the Rules?

A common point of confusion: each party has authority over different things.

| Decision                                  | Controlled by         |
| ----------------------------------------- | --------------------- |
| Auth validity window (e.g., 7 days)       | Card Network + Issuer |
| Interchange fee rates                     | Card Network          |
| Merchant discount rate (MDR)              | Acquirer              |
| Whether to approve a transaction          | Issuer                |
| When to capture                           | Merchant              |
| Card security rules (CVV, 3DS thresholds) | Card Network + Issuer |

---

## Part II — The Core Payment Lifecycle

---

### § 4 — Lifecycle at a Glance

The forward payment journey always follows this sequence:

```
Authorization → Capture → Clearing → Settlement
```

Memory aid: **Hold → Confirm → Reconcile → Pay**

After settlement, two reversal paths exist:

```
                    ┌── Refund (merchant-initiated)
SETTLED ────────────┤
                    └── Chargeback (cardholder-initiated dispute)
```

Before settlement, cancellation is handled by:

```
AUTHORIZED or CAPTURED ──▶ Void / Reversal
```

---

### § 5 — Authorization

**One-line definition:**
Checks availability of funds and places a temporary hold on the cardholder's credit line or account balance.

**What happens:**

- Merchant sends an authorization request via the Acquirer → Card Network → Issuer
- Issuer validates: card status, available credit/funds, fraud signals (velocity, geolocation, etc.)
- Issuer responds Approve or Decline in real time (typically < 2 seconds)
- If approved, the cardholder's available credit is reduced by the authorized amount — but no money moves

**Key characteristics:**

- Real-time and synchronous
- Funds are **not moved** — only locked (a "hold")
- Validity window is set by the Card Network and Issuer — **not** by the merchant
    - Standard retail: 7 days
    - Hotel / Car rental: up to 30 days
    - Some networks allow incremental authorization extensions

**Resulting states:**

| State        | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `AUTHORIZED` | Funds locked, awaiting capture                             |
| `DECLINED`   | Issuer refused the hold                                    |
| `REFERRAL`   | Issuer requests manual review (less common, mostly legacy) |

**Pre-Authorization (预授权):**
A specific form of authorization used when the final amount is unknown at check-in (hotels, gas stations, car rentals). The merchant places a hold for an estimated amount and adjusts at capture time. The cardholder sees the hold on their statement but it is not a final charge.

---

### § 6 — Capture

**One-line definition:**
The merchant's explicit instruction to finalize a previously authorized transaction and submit it for clearing.

**What happens:**

- Merchant (via PSP / Acquirer) sends a Capture request referencing the original Authorization ID
- Issuer converts the temporary hold into a posted transaction
- The transaction enters the clearing pipeline

**Key characteristics:**

- Initiated by the **merchant** — not the issuer or card network
- It is an **outbound request**, not a response to anything
- Can be immediate (auto-capture, common in e-commerce) or delayed (within the auth window)
- Capture amount must be **≤ authorized amount** — never more
- Partial capture releases the uncaptured remainder automatically

**Resulting state:** `CAPTURED`

**Why separate Authorization and Capture?**

This two-step design gives merchants operational flexibility:

- A hotel authorizes $500 at check-in → captures $420 at checkout
- A marketplace authorizes at order time → captures only when goods ship
- A merchant can void before capture if an order is cancelled — no refund required

**Capture failure scenarios:**

| Reason                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| Expired authorization        | Auth validity window has passed                   |
| Amount exceeded              | Capture amount > original authorized amount       |
| Auth already voided/reversed | Hold was released before capture                  |
| Post-settlement attempt      | Clearing batch already closed — new auth required |

> ⚠️ Once clearing and settlement have completed, the original authorization reference no longer exists. The protocol rejects the capture entirely. A new authorization must be initiated from scratch.

---

### § 7 — Clearing

**One-line definition:**
A batch reconciliation process where the acquirer and issuer exchange transaction records and calculate net financial obligations.

**What happens:**

- Runs as a **batch process**, typically end-of-business-day (though some networks run multiple batches)
- Acquirer compiles all captured transactions into a clearing file and submits to the Card Network
- Card Network routes records to the respective issuers
- Interchange fees and processing fees are calculated per transaction
- A net position is computed: how much the issuer owes the acquirer (gross sales minus interchange)
- A clearing file is generated as the basis for settlement instructions

**Key characteristics:**

- Asynchronous (not real-time)
- Only processes **already-captured** transactions
- Does not move money — it prepares the accounting and sends instructions to settlement systems
- Merchants do not interact with this step directly

**Resulting state:** Transaction enters the settlement pipeline; no externally visible status change for the cardholder

---

### § 8 — Settlement

**One-line definition:**
The actual movement of funds from the issuer to the acquirer, and ultimately into the merchant's bank account.

**What happens:**

- Based on the cleared batch, the issuer transfers net funds to the Card Network's settlement bank
- The Card Network distributes to each acquirer
- The acquirer deposits the net amount (after its own fees) into the merchant's bank account

**Key characteristics:**

- The **only step where money physically moves**
- Timing: T+1 or T+2 in most markets; some faster-payment rails achieve same-day
- Settlement is **net**: interchange fees and processing fees are deducted before the merchant receives funds
- Merchants reconcile their bank deposits against their transaction records to verify settlement accuracy

**Resulting state:** `SETTLED`

**Settlement timing by network (approximate):**

| Network                    | Typical timing        |
| -------------------------- | --------------------- |
| Visa / Mastercard          | T+1 to T+2            |
| American Express           | T+1 to T+3            |
| UnionPay                   | T+1                   |
| Local faster payment rails | Same day or real-time |

---

### § 9 — Full Forward Flow Diagram

```
┌─────────────┐
│ Cardholder  │
└──────┬──────┘
       │ swipes / taps card
       ▼
┌──────────┐    ┌──────────┐    ┌─────────┐    ┌────────┐
│ Merchant │───▶│ Acquirer │───▶│ Network │───▶│ Issuer │
└──────────┘    └──────────┘    └─────────┘    └───┬────┘
       ▲                                            │
       └─────────── Auth Response (Approve/Decline)─┘

§ 5 STATUS: AUTHORIZED — funds locked, no money moved

       │
       │ § 6 Capture (merchant-initiated, within auth window)
       ▼
Merchant ──▶ Acquirer ──▶ Network ──▶ Issuer

§ 6 STATUS: CAPTURED — hold converted to posted transaction

       │
       │ § 7 Clearing (batch, end-of-day)
       ▼
Acquirer ──▶ Network ──▶ Issuer
[Interchange calculated, clearing file generated]

       │
       │ § 8 Settlement (T+1 / T+2)
       ▼
Issuer ──▶ Network ──▶ Acquirer ──▶ Merchant Bank Account

§ 8 STATUS: SETTLED — funds received by merchant
```

---

## Part III — Reversal Operations

---

### § 10 — Void / Reversal (撤销)

**One-line definition:**
Cancels a transaction before it reaches settlement, releasing the authorization hold without requiring a refund.

**When it applies:** After `AUTHORIZED` or `CAPTURED`, but **before** the clearing batch closes.

**What happens:**

- Merchant sends a Void (or Reversal) request referencing the original authorization
- The hold on the cardholder's account is released immediately or within hours
- No funds move — the transaction is cancelled at the protocol level
- No refund transaction is needed because settlement never occurred

**Void vs. Reversal — the distinction:**

| Term                       | Context                                                | Timing                     |
| -------------------------- | ------------------------------------------------------ | -------------------------- |
| **Void**                   | Cancels a capture before clearing                      | Post-capture, pre-clearing |
| **Authorization Reversal** | Releases an auth hold that will not be captured        | Post-auth, pre-capture     |
| **Reversal**               | Generic term; sometimes used interchangeably with void | Either stage               |

**Key characteristic:** Because no money ever moved, the cardholder sees the hold disappear from their available balance — typically within minutes to 1 business day, depending on the issuer.

**When to prefer Void over Refund:**

If a customer cancels an order before the daily clearing batch runs, always void rather than refund. A void is immediate and free; a refund initiates an entirely new transaction and can take days to appear.

**Resulting state:** `VOIDED` / `REVERSED`

---

### § 11 — Refund (退款)

**One-line definition:**
A merchant-initiated reversal of a settled transaction that sends money back to the cardholder.

**When it applies:** After `SETTLED` — the original transaction has already cleared and funds have been received by the merchant.

**What happens:**

- Merchant initiates a Refund (also called a Credit transaction) via their PSP or Acquirer
- This creates a **new, separate transaction** — not a cancellation of the original
- The acquirer processes the credit through clearing and settlement in reverse
- Funds flow: Merchant → Acquirer → Card Network → Issuer → Cardholder's account

**Key characteristics:**

- Merchant bears the cost: funds are deducted from the merchant's account immediately or at next settlement
- The original transaction remains in the ledger; a corresponding credit entry is added
- Interchange fees on the original transaction are typically not refunded to the merchant
- Timing: the cardholder usually sees the credit in 3–7 business days (subject to issuer posting)
- A refund can be **full** (entire settled amount) or **partial** (a portion of it)

**Resulting states:**

| State                | Meaning                                                 |
| -------------------- | ------------------------------------------------------- |
| `REFUND_PENDING`     | Refund initiated, awaiting clearing                     |
| `REFUNDED`           | Credit cleared and settled to cardholder                |
| `PARTIALLY_REFUNDED` | Only a portion of the original amount has been returned |

**Refund vs. Void — decision rule:**

```
Transaction already settled?
   YES → Refund (new credit transaction)
   NO  → Void/Reversal (cancel in place)
```

---

### § 12 — Chargeback (拒付 / 争议)

**One-line definition:**
A cardholder-initiated dispute that forces the reversal of a settled transaction, with the card network acting as arbitrator.

**Why it exists:** Chargebacks are a consumer protection mechanism built into the card network rules. The cardholder has the right to dispute a transaction directly with their issuer if they believe it was unauthorized, fraudulent, or the merchant failed to deliver.

**What happens — the dispute lifecycle:**

```
Stage 1 — Dispute Initiation
Cardholder contacts Issuer → claims dispute
Issuer provisionally credits the cardholder's account (chargeback filed)
Issuer sends chargeback to Card Network → routed to Acquirer → Merchant

Stage 2 — Merchant Response (Representment)
Merchant has a response window (typically 20–45 days per network rules)
Merchant can:
  (a) Accept the chargeback (funds are lost)
  (b) Fight it — submit "Representment" with evidence:
      • Proof of delivery
      • Signed receipts
      • Communication logs
      • 3DS authentication records

Stage 3 — Pre-Arbitration
If merchant wins Representment but cardholder re-disputes:
Issuer may escalate to pre-arbitration

Stage 4 — Arbitration
Card Network makes the final binding ruling
Losing party pays an arbitration fee (typically $250–$500)
```

**Chargeback reason codes:** Every network has a taxonomy of reason codes. Common categories:

| Category                  | Examples                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------- |
| **Fraud / Unauthorized**  | Card not present fraud, lost/stolen card used                                           |
| **Authorization issues**  | Transaction processed without valid auth                                                |
| **Processing errors**     | Duplicate charge, incorrect amount, currency error                                      |
| **Consumer disputes**     | Item not received, item not as described, services not rendered, cancelled subscription |
| **Cancelled transaction** | Recurring billing after cancellation                                                    |

**Resulting states:**

| State                 | Meaning                                                      |
| --------------------- | ------------------------------------------------------------ |
| `CHARGEBACK_RECEIVED` | Dispute filed; funds provisionally returned to cardholder    |
| `UNDER_REVIEW`        | Merchant is preparing or has submitted representment         |
| `CHARGEBACK_WON`      | Merchant representment accepted; funds returned to merchant  |
| `CHARGEBACK_LOST`     | Dispute resolved in cardholder's favor; merchant loses funds |
| `ARBITRATION`         | Escalated to card network for final ruling                   |

**Chargeback vs. Refund — critical distinction:**

| Dimension         | Refund                         | Chargeback                                                    |
| ----------------- | ------------------------------ | ------------------------------------------------------------- |
| Initiated by      | Merchant                       | Cardholder (via Issuer)                                       |
| Merchant choice   | Yes — merchant decides         | No — forced reversal                                          |
| Additional fees   | None (beyond lost interchange) | Chargeback fee ($15–$100 per dispute)                         |
| Disputable        | N/A                            | Yes — merchant can fight via Representment                    |
| Reputation impact | None                           | Chargeback ratio tracked; too high = penalties or termination |
| Timing            | Merchant controls              | Cardholder has 60–120 days from statement date                |

**Chargeback ratio:** Card networks monitor each merchant's chargeback rate (chargebacks ÷ total transactions). Exceeding thresholds (e.g., Visa: 0.9%, Mastercard: 1.0%) triggers the merchant into monitoring programs, higher fees, or account termination.

---

## Part IV — Supporting Concepts

---

### § 13 — Interchange Fee (交换费)

**One-line definition:**
A fee paid by the acquirer (merchant's bank) to the issuer (cardholder's bank) for each transaction, set by the card network.

**Why it exists:** Interchange compensates the issuer for the credit risk, fraud liability, and cost of maintaining cardholder accounts and rewards programs.

**How it works:**

- The card network publishes interchange rate tables (public for Visa/Mastercard)
- Rates vary by: card type (debit vs. credit), card tier (standard vs. premium rewards), merchant category code (MCC), transaction type (card present vs. card not present), and geography
- The acquirer pays interchange to the issuer during settlement
- The acquirer recovers this cost (plus its own margin) from the merchant as the Merchant Discount Rate (MDR)

**Fee flow:**

```
Merchant pays MDR to Acquirer
   │
   Acquirer keeps: Acquirer margin
   Acquirer pays: Interchange to Issuer (via Network)
   Acquirer pays: Network assessment fee to Card Network
```

**Typical interchange ranges (illustrative, varies by market):**

| Transaction type                    | Approximate range |
| ----------------------------------- | ----------------- |
| Debit card, card present            | 0.05% – 0.80%     |
| Credit card, standard, card present | 1.15% – 1.80%     |
| Credit card, premium rewards, CNP   | 1.80% – 2.70%     |
| Commercial / Corporate card         | 2.00% – 3.50%     |

> Note: Interchange is the largest component of the fees a merchant pays. Understanding it is key to optimizing payment costs (interchange optimization / least-cost routing).

---

### § 14 — Payment Service Provider (PSP)

**One-line definition:**
A third-party intermediary that provides merchants access to payment processing infrastructure without requiring a direct acquiring relationship with a bank.

**What a PSP does:**

- Provides a unified API for merchants to accept multiple payment methods
- Holds acquiring licenses or partners with acquiring banks
- Handles payment gateway, fraud screening, tokenization, and reporting
- Aggregates merchants under a single MID (Merchant ID) or provisions individual MIDs

**PSP models:**

| Model                  | Description                                      | Examples                      |
| ---------------------- | ------------------------------------------------ | ----------------------------- |
| **Payment Aggregator** | Merchant operates under PSP's master MID         | Stripe, Square, PayPal        |
| **Full acquiring PSP** | PSP provides dedicated MID per merchant          | Adyen, Worldpay, Checkout.com |
| **Gateway-only PSP**   | Routes to a separate acquirer; no funds handling | Authorize.net (legacy mode)   |

**Why it matters:**

- A small merchant using Stripe doesn't have a direct relationship with Visa — Stripe is their acquirer/PSP
- PSPs abstract away the complexity of card network certification, PCI compliance infrastructure, and bank relationships
- Aggregators come with faster onboarding but less control over underwriting, pricing, and fund holds

---

### § 15 — 3D Secure (3DS) — Authentication (身份验证)

**One-line definition:**
An additional authentication layer that verifies the cardholder's identity during a card-not-present (CNP) transaction to reduce fraud and shift liability.

**Background:** 3DS was developed by Visa (Verified by Visa / Visa Secure) and adopted across networks. The current version is **3DS2**, which supports frictionless authentication via device data.

**How it works:**

```
Cardholder initiates payment on merchant website/app
    │
    ▼
Merchant (via 3DS SDK or gateway) sends device/session data to the ACS
(Access Control Server, operated by the Issuer)
    │
    ▼
Issuer performs risk assessment:

  Low risk → Frictionless flow: authentication passes silently (no OTP)
  High risk → Challenge flow: cardholder must verify (OTP, biometric, app push)
    │
    ▼
Authentication result (Y/N/A) returned to merchant
    │
    ▼
Merchant includes 3DS data in the authorization request
```

**Liability shift — the key commercial reason for 3DS:**

| Scenario                                  | Fraud liability falls on              |
| ----------------------------------------- | ------------------------------------- |
| No 3DS authentication                     | Merchant (card-not-present liability) |
| 3DS attempted, issuer passed frictionless | Issuer                                |
| 3DS challenge completed successfully      | Issuer                                |
| 3DS challenge failed / abandoned          | Merchant                              |

> This means: if a merchant properly implements 3DS and a fraudster passes authentication, the merchant is **not liable** for the resulting chargeback — the issuer bears it.

**Authentication result codes:**

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| `Y`  | Fully authenticated                     |
| `A`  | Attempted — issuer does not support 3DS |
| `N`  | Authentication failed                   |
| `U`  | Authentication unavailable              |
| `C`  | Challenge required                      |

---

### § 16 — Tokenization (令牌化)

**One-line definition:**
The process of replacing a sensitive card number (PAN — Primary Account Number) with a non-sensitive surrogate value (token) that can be used for payment processing.

**Why it exists:** Storing real PANs creates massive security and PCI-DSS compliance risk. If a token is stolen, it cannot be used outside the specific context it was issued for.

**Two types of tokenization:**

| Type                  | Issued by                       | Used for                           | Example                                        |
| --------------------- | ------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Network Token**     | Card Network (Visa, Mastercard) | CNP transactions, card-on-file     | A token issued by Visa for a specific merchant |
| **PSP/Gateway Token** | PSP or payment gateway          | Storing card for recurring billing | Stripe's `pm_xxx` token                        |

**Network tokenization benefits:**

- Token is **merchant-specific** and **device-specific** — stolen token useless elsewhere
- Network automatically updates tokens when a card is reissued (expired, lost, stolen) → higher authorization rates
- Some networks offer lower interchange rates for tokenized transactions
- Reduces PCI scope for the merchant (no real PAN stored)

**Flow:**

```
Cardholder enters card → PAN sent to Token Service Provider (TSP)
TSP generates Token + Cryptogram
Token used in auth request (never the real PAN)
Issuer detokenizes for approval using the TSP mapping
```

---

### § 17 — Merchant Category Code (MCC)

**One-line definition:**
A four-digit code assigned by the acquirer that classifies a merchant's primary business type, used by card networks to apply appropriate interchange rates, fraud rules, and cardholder protections.

**Why it matters:**

- Different MCCs attract different interchange rates (e.g., supermarkets get lower rates than jewelry stores)
- Some MCCs are restricted (e.g., gambling, adult content) — certain issuers block transactions to these MCCs
- Tax reporting and corporate card expense management systems use MCC to categorize spend
- Chargeback rules and dispute timeframes can differ by MCC

**Example MCCs:**

| MCC  | Category                              |
| ---- | ------------------------------------- |
| 5411 | Grocery stores and supermarkets       |
| 5812 | Eating places and restaurants         |
| 5732 | Electronics stores                    |
| 4111 | Local and suburban commuter transport |
| 7995 | Gambling / betting                    |
| 6011 | ATM cash disbursements                |

---

## Part V — Reference

---

### § 18 — State Transition Summary

```
                        ┌─────────────────────────────────────────┐
                        │           Payment State Machine          │
                        └─────────────────────────────────────────┘

[NEW] ──▶ AUTHORIZED ──────────────────────────────────▶ REVERSED
              │                                      (auth reversal)
              │
              ▼
          CAPTURED ──────────────────────────────────▶ VOIDED
              │                                    (void pre-clearing)
              │
              ▼
          CLEARING (internal state, not always exposed)
              │
              ▼
          SETTLED ─────────────┬─────────────────────────────────
                               │                                 │
                               ▼                                 ▼
                        REFUND_PENDING                 CHARGEBACK_RECEIVED
                               │                                 │
                               ▼                          ┌──────┴──────┐
                           REFUNDED               CHARGEBACK_WON   CHARGEBACK_LOST
                    (full or partial)
```

---

### § 19 — Common Misconceptions

| Misconception                                  | Reality                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Capture = capturing the auth response          | Capture is a new **outbound request**, not a response                                      |
| Capture = Settlement                           | Capture triggers clearing; settlement is a separate, later step                            |
| Capture = Clearing                             | Clearing is a batch reconciliation that follows capture                                    |
| After settlement you can still capture         | Auth reference no longer exists; a new transaction is required                             |
| The merchant controls the auth validity window | Set by the **card network and issuer**, not the merchant                                   |
| Refund = Void                                  | Void cancels pre-settlement; Refund is a new credit post-settlement                        |
| Chargeback = Refund                            | Refund is voluntary (merchant); Chargeback is forced (cardholder + issuer)                 |
| 3DS guarantees no chargebacks                  | 3DS shifts liability — chargebacks can still occur but liability moves to issuer           |
| PSP = Acquirer                                 | PSPs may act as acquirers, or they may partner with acquiring banks — depends on the model |
| Interchange = MDR                              | Interchange is paid to the issuer; MDR is the total merchant fee charged by the acquirer   |

---

### § 20 — One-Sentence Definitions (Interview-Ready)

> **Cardholder** — The individual who holds and uses the payment card issued by their bank.

> **Merchant** — The business accepting card payments and initiating the transaction flow.

> **Acquirer** — The merchant's bank or PSP that routes transactions to the card network and receives settlement funds on behalf of the merchant.

> **Card Network** — The scheme (Visa, Mastercard, UnionPay) that sets rules, routes authorization messages, calculates interchange, and settles funds between issuer and acquirer.

> **Issuer** — The cardholder's bank that approves or declines transactions, holds cardholder funds, and bears fraud liability in authenticated transactions.

> **Authorization** — Verifies and temporarily holds funds on the cardholder's account in real time without moving money.

> **Capture** — The merchant's explicit instruction to finalize a previously authorized transaction and submit it for clearing.

> **Clearing** — Batch reconciliation between acquirer and issuer that calculates net obligations and prepares for fund transfer.

> **Settlement** — The actual movement of funds from issuer to acquirer to merchant bank account.

> **Void / Reversal** — Cancellation of a transaction before it reaches settlement; releases the hold without a refund.

> **Refund** — A merchant-initiated credit transaction that returns settled funds to the cardholder after settlement has completed.

> **Chargeback** — A forced reversal initiated by the cardholder through their issuer, bypassing the merchant, typically used for fraud or dispute resolution.

> **Interchange** — The fee paid by the acquirer to the issuer per transaction, as set by the card network, representing the largest component of merchant payment costs.

> **PSP (Payment Service Provider)** — An intermediary that gives merchants access to payment infrastructure, handling gateway, acquiring, and often tokenization and fraud tools under one contract.

> **3D Secure (3DS)** — A cardholder authentication protocol for card-not-present transactions that, when passed, shifts fraud liability from the merchant to the issuer.

> **Tokenization** — Replacing a real card number (PAN) with a surrogate token that is useless if stolen outside its intended context.

> **MCC (Merchant Category Code)** — A four-digit code classifying a merchant's business type, used to determine interchange rates, spending controls, and fraud rules.

---

_Document version: 2.0 — Full expansion: Four-Party Model, Authorization, Capture, Clearing, Settlement, Void, Refund, Chargeback, Interchange, PSP, 3DS, Tokenization, MCC_
