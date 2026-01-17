// ============================================================================
// FILE: kycLevels.ts
// PURPOSE: KYC (Know Your Customer) verification levels and limits
// ============================================================================

/**
 * KYC_LEVELS
 *
 * Defines all valid KYC verification levels across the entire system.
 * These are the ONLY acceptable values for merchant KYC classification.
 * Each level represents increasing customer verification requirements.
 */
export const KYC_LEVELS = {
    Unverified: "Unverified", // No identity verification - highest risk
    Basic: "Basic", // Basic identity info collected
    Standard: "Standard", // Full KYC verification completed
    Business: "Business", // Business entity verification
    VIP: "VIP", // Enhanced verification for high-value accounts
} as const;

/**
 * KYCLevel type
 *
 * Union type derived from KYC_LEVELS to ensure type safety.
 * Only values from KYC_LEVELS object are valid KYC levels.
 * Used throughout the codebase for type checking and validation.
 */
export type KYCLevel = (typeof KYC_LEVELS)[keyof typeof KYC_LEVELS];

/**
 * KYC_LIMITS
 *
 * Transaction and balance limits per KYC verification level.
 * Higher verification levels allow larger transaction amounts and balances.
 *
 * maxTx: Maximum single transaction amount allowed (in fiat currency units)
 * maxBalance: Maximum account balance allowed at any time
 *
 * Risk Philosophy:
 * - Unverified: Blocked completely (risk of account abuse)
 * - Basic: Allows small transactions for retail customers
 * - Standard: Supports normal business operations
 * - Business: Higher limits for business entities
 * - VIP: Premium customers with highest trust levels
 */
export const KYC_LIMITS: Record<
    KYCLevel,
    { maxBalance: number; maxTx: number }
> = {
    Unverified: { maxBalance: 0, maxTx: 0 }, // No transactions allowed
    Basic: { maxBalance: 500, maxTx: 100 }, // Up to 100 per transaction
    Standard: { maxBalance: 5000, maxTx: 1000 }, // Up to 1000 per transaction
    Business: { maxBalance: 50000, maxTx: 10000 }, // Up to 10000 per transaction
    VIP: { maxBalance: 500000, maxTx: 100000 }, // Up to 100000 per transaction
};
