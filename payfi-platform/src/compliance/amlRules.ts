// ============================================================================
// FILE: amlRules.ts
// PURPOSE: Anti-Money Laundering (AML) detection rules engine
// ============================================================================

/**
 * AML Rules Engine
 *
 * Detects suspicious transaction patterns that may indicate money laundering.
 * This is a simplified educational version for demonstration purposes.
 */

/**
 * detectStructuring
 *
 * Identifies "structuring" - a common money laundering technique where
 * a large sum is broken into many small transactions to evade detection.
 *
 * @param recentTransactions - Array of transaction amounts in a time window
 * @param threshold - The cumulative amount above which structuring is suspected
 * @returns true if structuring pattern detected, false otherwise
 *
 * Rule: If 3+ transactions total more than the threshold, flag for review
 */
export function detectStructuring(
    recentTransactions: number[],
    threshold: number
): boolean {
    const total = recentTransactions.reduce((a, b) => a + b, 0);
    return recentTransactions.length >= 3 && total > threshold;
}

/**
 * detectHighFrequency
 *
 * Identifies unusually high transaction frequency within a short time window.
 * Multiple rapid transactions can indicate automated fraud or money laundering.
 *
 * @param txCountLastMinute - Number of transactions in the last minute
 * @returns true if frequency exceeds safe threshold, false otherwise
 *
 * Rule: More than 5 transactions per minute is suspicious
 */
export function detectHighFrequency(txCountLastMinute: number): boolean {
    return txCountLastMinute > 5;
}
