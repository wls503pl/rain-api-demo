// ============================================================================
// FILE: riskEngine.ts
// PURPOSE: Check if transaction is allowed based on KYC limits
// ============================================================================

import { KYC_LIMITS, KYCLevel } from "./kycLevels";

// Container for transaction information
type RiskContext = {
    merchantId: number; // Who is making this transaction
    kycLevel: KYCLevel; // Their verification level
    amount: number; // How much they want to transact
    dailyTotal: number; // Total transacted today
    recentTxCount: number; // Number of recent transactions
    recentAmounts: number[]; // Recent transaction amounts
};

// Evaluate if a transaction is allowed
// Returns: { allowed: true/false, reason: error code }
export function evaluateRisk(ctx: RiskContext) {
    // Get limits for this merchant's KYC level
    const limits = KYC_LIMITS[ctx.kycLevel];

    // Check 1: Single transaction too large?
    if (ctx.amount > limits.maxTx)
        return { allowed: false, reason: "KYC_TX_LIMIT" };

    // Check 2: Daily total exceeds balance limit?
    if (ctx.dailyTotal > limits.maxBalance)
        return { allowed: false, reason: "KYC_BALANCE_LIMIT" };

    // All checks passed
    return { allowed: true };
}
