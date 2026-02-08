import { evaluateRisk } from "../compliance/riskEngine";

describe("Risk Engine", () => {
    describe("Transaction Validation", () => {
        it("should reject Unverified merchant for any transaction", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Unverified",
                amount: 50,
                dailyTotal: 50,
                recentTxCount: 1,
                recentAmounts: [50],
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("KYC_TX_LIMIT");
        });

        it("should allow Basic merchant within limits", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: 50, // Under 100 limit
                dailyTotal: 50,
                recentTxCount: 1,
                recentAmounts: [50],
            });

            expect(result.allowed).toBe(true);
        });

        it("should reject Basic merchant exceeding single tx limit", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: 150, // Over 100 limit
                dailyTotal: 150,
                recentTxCount: 1,
                recentAmounts: [150],
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("KYC_TX_LIMIT");
        });

        it("should reject Basic merchant exceeding balance limit", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Basic",
                amount: 100,
                dailyTotal: 600,
                recentTxCount: 1,
                recentAmounts: [100],
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("KYC_BALANCE_LIMIT");
        });

        it("should allow Standard merchant with higher amounts", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "Standard",
                amount: 500, // Under 1000 limit
                dailyTotal: 500,
                recentTxCount: 1,
                recentAmounts: [500],
            });

            expect(result.allowed).toBe(true);
        });

        it("should allow VIP merchant with maximum amounts", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "VIP",
                amount: 100000, // Max VIP limit
                dailyTotal: 100000,
                recentTxCount: 1,
                recentAmounts: [100000],
            });

            expect(result.allowed).toBe(true);
        });

        it("should reject VIP merchant exceeding limit", () => {
            const result = evaluateRisk({
                merchantId: 1,
                kycLevel: "VIP",
                amount: 150000, // Over 100000 limit
                dailyTotal: 150000,
                recentTxCount: 1,
                recentAmounts: [150000],
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("KYC_TX_LIMIT");
        });
    });
});
