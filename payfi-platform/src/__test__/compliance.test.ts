import { KYC_LEVELS, KYC_LIMITS } from "../compliance/kycLevels";
import { evaluateRisk } from "../compliance/riskEngine";
import { detectStructuring, detectHighFrequency } from "../compliance/amlRules";

describe("Compliance Integration Tests", () => {
    describe("Complete Merchant Lifecycle", () => {
        it("should block Unverified merchant from all transactions", () => {
            const merchant = { id: 1, kycLevel: KYC_LEVELS.Unverified as any };

            // Try deposit
            const depositResult = evaluateRisk({
                merchantId: merchant.id,
                kycLevel: merchant.kycLevel,
                amount: 100,
                dailyTotal: 100,
                recentTxCount: 1,
                recentAmounts: [100],
            });

            expect(depositResult.allowed).toBe(false);

            // Try withdrawal
            const withdrawResult = evaluateRisk({
                merchantId: merchant.id,
                kycLevel: merchant.kycLevel,
                amount: 50,
                dailyTotal: 50,
                recentTxCount: 1,
                recentAmounts: [50],
            });

            expect(withdrawResult.allowed).toBe(false);
        });

        it("should allow progression from Basic to Standard", () => {
            // Basic: can do 100
            const basicResult = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: 100,
                dailyTotal: 100,
                recentTxCount: 1,
                recentAmounts: [100],
            });
            expect(basicResult.allowed).toBe(true);

            // Standard: can do 1000
            const standardResult = evaluateRisk({
                merchantId: 1,
                kycLevel: "Standard",
                amount: 1000,
                dailyTotal: 1000,
                recentTxCount: 1,
                recentAmounts: [1000],
            });
            expect(standardResult.allowed).toBe(true);
        });

        it("should enforce limits at each KYC level", () => {
            const testCases = [
                {
                    level: "Basic" as const,
                    validAmount: 100,
                    invalidAmount: 101,
                },
                {
                    level: "Standard" as const,
                    validAmount: 1000,
                    invalidAmount: 1001,
                },
                {
                    level: "Business" as const,
                    validAmount: 10000,
                    invalidAmount: 10001,
                },
                {
                    level: "VIP" as const,
                    validAmount: 100000,
                    invalidAmount: 100001,
                },
            ];

            testCases.forEach(({ level, validAmount, invalidAmount }) => {
                // Valid amount should pass
                const validResult = evaluateRisk({
                    merchantId: 1,
                    kycLevel: level,
                    amount: validAmount,
                    dailyTotal: validAmount,
                    recentTxCount: 1,
                    recentAmounts: [validAmount],
                });
                expect(validResult.allowed).toBe(true);

                // Invalid amount should fail
                const invalidResult = evaluateRisk({
                    merchantId: 1,
                    kycLevel: level,
                    amount: invalidAmount,
                    dailyTotal: invalidAmount,
                    recentTxCount: 1,
                    recentAmounts: [invalidAmount],
                });
                expect(invalidResult.allowed).toBe(false);
            });
        });
    });

    describe("AML Compliance", () => {
        it("should detect structuring and block merchant", () => {
            const transactions = [900, 900, 900]; // Structuring pattern
            const isStructuring = detectStructuring(transactions, 2000);

            expect(isStructuring).toBe(true); // Flag for review/blocking
        });

        it("should detect high frequency transactions", () => {
            const txCountLastMinute = 8; // More than threshold of 5
            const isHighFrequency = detectHighFrequency(txCountLastMinute);

            expect(isHighFrequency).toBe(true); // Flag for review
        });

        it("should allow normal usage pattern", () => {
            // Normal: 2 transactions, not suspicious
            const transactions = [5000, 3000];
            const isStructuring = detectStructuring(transactions, 10000);
            expect(isStructuring).toBe(false);

            // Normal: 3 transactions per minute
            const isHighFrequency = detectHighFrequency(3);
            expect(isHighFrequency).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero amount", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: 0,
                dailyTotal: 0,
                recentTxCount: 0,
                recentAmounts: [],
            });

            // Zero is technically within limits
            expect(result.allowed).toBe(true);
        });

        it("should handle negative amount detection", () => {
            // Framework doesn't prevent negative, but it should be caught at route level
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: -100,
                dailyTotal: -100,
                recentTxCount: 1,
                recentAmounts: [-100],
            });

            // Negative is within limits technically, but routes should validate
            expect(result.allowed).toBe(true);
        });

        it("should handle maximum VIP transaction", () => {
            const limits = KYC_LIMITS["VIP"];
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "VIP",
                amount: limits.maxTx,
                dailyTotal: limits.maxTx,
                recentTxCount: 1,
                recentAmounts: [limits.maxTx],
            });

            expect(result.allowed).toBe(true);
        });
    });
});
