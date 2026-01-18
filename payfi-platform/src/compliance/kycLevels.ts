// ============================================================================
// FILE: kycLevels.ts
// PURPOSE: Define KYC verification levels and transaction limits
// ============================================================================

// All valid KYC levels in the system
// Higher levels = more trusted merchants = higher transaction limits
export const KYC_LEVELS = {
    Unverified: "Unverified", // No verification - cannot transact
    Basic: "Basic", // Basic info verified
    Standard: "Standard", // Full verification done
    Business: "Business", // Business entity verified
    VIP: "VIP", // Premium customer
} as const;

// Type for KYC levels (ensures only valid levels are used)
export type KYCLevel = (typeof KYC_LEVELS)[keyof typeof KYC_LEVELS];

// Transaction limits for each KYC level
// maxTx = max amount per single transaction
// maxBalance = max total balance merchant can hold
export const KYC_LIMITS: Record<
    KYCLevel,
    { maxBalance: number; maxTx: number }
> = {
    Unverified: { maxBalance: 0, maxTx: 0 }, // Blocked
    Basic: { maxBalance: 500, maxTx: 100 }, // Small transactions
    Standard: { maxBalance: 5000, maxTx: 1000 }, // Normal business
    Business: { maxBalance: 50000, maxTx: 10000 }, // Large business
    VIP: { maxBalance: 500000, maxTx: 100000 }, // Premium
};
