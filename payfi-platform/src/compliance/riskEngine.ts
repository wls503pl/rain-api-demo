// ============================================================================
// FILE: riskEngine.ts
// PURPOSE: Core compliance decision engine - evaluates transactions against KYC limits
// ============================================================================

import { KYC_LIMITS, KYCLevel } from "./kycLevels";

type RiskContext = {
    merchantId: number;
    kycLevel: KYCLevel;
    amount: number;
    dailyTotal: number;
    recentTxCount: number;
    recentAmounts: number[];
};

export function evaluateRisk(ctx: RiskContext) {
    const limits = KYC_LIMITS[ctx.kycLevel];
    if (ctx.amount > limits.maxTx)
        return { allowed: false, reason: "KYC_TX_LIMIT" };
    if (ctx.dailyTotal > limits.maxBalance)
        return { allowed: false, reason: "KYC_BALANCE_LIMIT" };
    return { allowed: true };
}
