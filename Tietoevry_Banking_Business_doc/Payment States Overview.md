# Payment States Overview

> This document introduces key payment lifecycle states. This edition covers **Authorization**, **Capture**, **Clearing**, and **Settlement** — and how they relate to each other.
> _More states to be added in future updates._

---

## § 1 — The Lifecycle at a Glance

The four states always follow this sequence, no exceptions:

```
Authorization → Capture → Clearing → Settlement
```

Memory aid: **Hold → Confirm → Reconcile → Pay**

---

## § 2 — Authorization

**One-line definition:**  
Checks availability of funds and places a temporary hold on the cardholder's credit line.

**What happens:**

- Merchant → Acquirer → Card Network (Visa / Mastercard) → Issuer
- Issuer approves or declines and freezes the credit limit
- Authorization response is returned to the merchant in real time (milliseconds)

**Key characteristics:**

- Real-time and synchronous
- Funds are **not moved** — only locked
- Has a validity window defined by the card network and issuer (typically 7 days for standard transactions, up to 30 days for hotel/car rental)

**Resulting states:**

| State        | Meaning                        |
| ------------ | ------------------------------ |
| `AUTHORIZED` | Funds locked, awaiting capture |
| `DECLINED`   | Issuer refused the hold        |

---

## § 3 — Capture

**One-line definition:**  
Confirms the merchant's intent to collect the funds from a previously authorized transaction, submitting it for clearing.

**What happens:**

- Merchant (via PSP / Acquirer) sends a Capture request referencing the original authorization
- Issuer converts the temporary hold into a posted transaction
- The transaction enters the clearing pipeline

**Key characteristics:**

- Initiated by the **merchant**, not the issuer or card network
- It is a **request**, not a response
- Can happen immediately (same day) or be delayed within the authorization validity window
- Capture amount can be **equal to or less than** the authorized amount (e.g., hotel room block vs. actual stay cost)

**Resulting state:** `CAPTURED`

**Why separate Authorization and Capture?**

This two-step design gives merchants flexibility. A hotel can authorize $500 at check-in and only capture $420 at checkout — releasing the remaining $80 automatically.

**Capture failure scenarios:**

| Reason                  | Description                               |
| ----------------------- | ----------------------------------------- |
| Expired authorization   | Auth validity window passed               |
| Amount exceeded         | Capture amount > original auth amount     |
| Auth already reversed   | Funds were released before capture        |
| Post-settlement attempt | Clearing batch already closed (see below) |

> ⚠️ Once clearing and settlement have completed, the original authorization **can no longer be captured**. This is not "capture succeeds but funds don't arrive" — the protocol rejects the capture entirely. A new authorization must be initiated.

---

## § 4 — Clearing

**One-line definition:**  
Exchanges transaction details between the acquirer and issuer to calculate net financial obligations.

**What happens:**

- Runs as a **batch process**, typically at end-of-day
- Acquirer submits all captured transactions to the card network
- Card network routes details to the issuer
- Interchange fees and processing fees are calculated
- A clearing file is generated as the basis for settlement

**Key characteristics:**

- Asynchronous (not real-time)
- Only processes **already-captured** transactions
- Does not move money itself — it prepares the accounting

**Resulting state:** Transaction moves into settlement pipeline

---

## § 5 — Settlement

**One-line definition:**  
Moves funds from the issuer to the acquirer, and ultimately into the merchant's bank account.

**What happens:**

- Based on the cleared batch, the issuer transfers net funds to the card network
- Card network distributes to the acquirer
- Acquirer deposits into the merchant's bank account

**Key characteristics:**

- The only step where **money actually moves**
- Timing: T+1, T+2, or T+N depending on the network and agreement
- The step merchants care about most

**Resulting state:** `SETTLED`

---

## § 6 — Full Flow Diagram

```
┌─────────────┐
│ Cardholder  │
└──────┬──────┘
       │
       │  § 2 Authorization (real-time)
       ▼
┌──────────┐    ┌──────────┐    ┌─────────┐    ┌────────┐
│ Merchant │───▶│ Acquirer │───▶│ Network │───▶│ Issuer │
└──────────┘    └──────────┘    └─────────┘    └───┬────┘
       ▲                                            │
       └────────── Auth Response (Approve/Decline) ─┘

Status: AUTHORIZED — funds locked, no money moved

       │
       │  § 3 Capture (immediate or delayed, within auth window)
       ▼
Merchant ───▶ Acquirer (Capture Request) ───▶ Network ───▶ Issuer

Status: CAPTURED — hold converted to posted transaction

       │
       │  § 4 Clearing (batch, end-of-day)
       ▼
Acquirer ───▶ Network ───▶ Issuer

Events: transaction reconciliation, interchange calculation, clearing file generated

       │
       │  § 5 Settlement (T+1 / T+2)
       ▼
Issuer ───▶ Network ───▶ Acquirer ───▶ Merchant Bank Account

Status: SETTLED — funds received
```

---

## § 7 — Common Misconceptions

| Misconception                                  | Reality                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Capture = capturing the auth response          | Capture is a new **outbound request**, not a response                        |
| Capture = Settlement                           | Capture triggers clearing; settlement is a separate, later step              |
| Capture = Clearing                             | Clearing is a batch reconciliation process that follows capture              |
| After settlement you can still capture         | The authorization reference no longer exists — a new transaction is required |
| The merchant controls the auth validity window | Auth window is set by the **card network and issuer**, not the merchant      |

---

## § 8 — One-Sentence Definitions (Interview-Ready)

> **Authorization** — Verifies and temporarily holds funds on the cardholder's account in real time.

> **Capture** — The merchant's explicit instruction to finalize a previously authorized transaction and submit it for clearing.

> **Clearing** — Batch reconciliation between acquirer and issuer that calculates net obligations and prepares for fund transfer.

> **Settlement** — The actual movement of funds from issuer to acquirer to merchant bank account.

---

_Document version: 1.0 — Authorization, Capture, Clearing, Settlement_  
_More payment states to be covered in future editions._
