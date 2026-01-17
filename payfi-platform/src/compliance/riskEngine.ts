// ============================================================================
// FILE: riskEngine.ts
// PURPOSE: Core compliance decision engine - evaluates transactions against KYC limits
// ============================================================================

import { KYC_LIMITS, KYCLevel } from "./kycLevels";

/**
 * RiskContext
 *
 * Complete context information for a transaction being evaluated.
 * Used by evaluateRisk() to make compliance decisions.
 *
 * Fields:
 * - merchantId: Unique identifier of the merchant making the transaction
 * - kycLevel: Customer's KYC verification level (determines limits)
 * - amount: Transaction amount to be evaluated
 * - dailyTotal: Total transaction volume for the current day
 * - recentTxCount: Number of recent transactions in time window
 * - recentAmounts: Array of recent transaction amounts
 */
type RiskContext = {
    merchantId: number;
    kycLevel: KYCLevel;
    amount: number;
    dailyTotal: number;
    recentTxCount: number;
    recentAmounts: number[];
};

/**
 * evaluateRisk
 *
 * Core compliance decision engine. Evaluates a transaction against
 * the customer's KYC limits to determine if it should be allowed.
 *
 * This is the single source of truth for transaction approval/rejection.
 * Called by: wallets.ts, cards.ts compliance checks
 *
 * @param ctx - Complete transaction context
 * @returns Object with 'allowed' (boolean) and optional 'reason' for rejection
 *
 * Decision Logic:
 * 1. Check single transaction amount against maxTx limit
 * 2. Check daily balance total against maxBalance limit
 * 3. If all checks pass, allow transaction
 * 4. Otherwise, reject with specific reason code
 *
 * Rejection Reasons:
 * - KYC_TX_LIMIT: Single transaction exceeds customer's per-transaction limit
 * - KYC_BALANCE_LIMIT: Daily total would exceed customer's balance limit
 */
export function evaluateRisk(ctx: RiskContext) {
    // Fetch the limits applicable to this customer's KYC level
    const limits = KYC_LIMITS[ctx.kycLevel];

    // Check 1: Does this transaction exceed the single transaction limit?
    if (ctx.amount > limits.maxTx) {
        return { allowed: false, reason: "KYC_TX_LIMIT" };
    }

    // Check 2: Would the daily total exceed the balance limit?
    if (ctx.dailyTotal > limits.maxBalance) {
        return { allowed: false, reason: "KYC_BALANCE_LIMIT" };
    }

    // All checks passed - transaction is compliant
    return { allowed: true };
}
