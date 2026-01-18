// ============================================================================
// FILE: amlRules.ts
// PURPOSE: Anti-Money Laundering detection rules
// ============================================================================

// Detect "structuring" - breaking large amounts into small transactions
// Example: Splitting $10,000 into 10x $1,000 to avoid detection
// @param recentTransactions - List of transaction amounts
// @param threshold - Amount that triggers suspicion
// @return true if structuring pattern detected
export function detectStructuring(
    recentTransactions: number[],
    threshold: number
): boolean {
    // Calculate total of all recent transactions
    const total = recentTransactions.reduce((a, b) => a + b, 0);

    // Flag if 3+ transactions total more than threshold
    return recentTransactions.length >= 3 && total > threshold;
}

// Detect high transaction frequency (potential automated fraud)
// Example: 10 transactions in 1 minute is suspicious
// @param txCountLastMinute - Number of transactions in last 60 seconds
// @return true if frequency is too high
export function detectHighFrequency(txCountLastMinute: number): boolean {
    // Flag if more than 5 transactions per minute
    return txCountLastMinute > 5;
}
