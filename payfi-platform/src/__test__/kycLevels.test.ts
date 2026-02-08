import { KYC_LEVELS, KYC_LIMITS, type KYCLevel } from "../compliance/kycLevels";

describe("KYC Levels and Limits", () => {
    describe("KYC Levels", () => {
        it("should have all required KYC levels", () => {
            expect(Object.keys(KYC_LEVELS)).toContain("Unverified");
            expect(Object.keys(KYC_LEVELS)).toContain("Basic");
            expect(Object.keys(KYC_LEVELS)).toContain("Standard");
            expect(Object.keys(KYC_LEVELS)).toContain("Business");
            expect(Object.keys(KYC_LEVELS)).toContain("VIP");
        });
    });

    describe("Transaction Limits", () => {
        it("Unverified should have zero limits", () => {
            const limits = KYC_LIMITS["Unverified"];
            expect(limits.maxTx).toBe(0);
            expect(limits.maxBalance).toBe(0);
        });

        it("Basic level should have correct limits", () => {
            const limits = KYC_LIMITS["Basic"];
            expect(limits.maxTx).toBe(100);
            expect(limits.maxBalance).toBe(500);
        });

        it("Standard level should have correct limits", () => {
            const limits = KYC_LIMITS["Standard"];
            expect(limits.maxTx).toBe(1000);
            expect(limits.maxBalance).toBe(5000);
        });

        it("Business level should have correct limits", () => {
            const limits = KYC_LIMITS["Business"];
            expect(limits.maxTx).toBe(10000);
            expect(limits.maxBalance).toBe(50000);
        });

        it("VIP level should have highest limits", () => {
            const limits = KYC_LIMITS["VIP"];
            expect(limits.maxTx).toBe(100000);
            expect(limits.maxBalance).toBe(500000);
        });

        it("limits should increase with each level", () => {
            const unverified = KYC_LIMITS["Unverified"].maxTx;
            const basic = KYC_LIMITS["Basic"].maxTx;
            const standard = KYC_LIMITS["Standard"].maxTx;
            const business = KYC_LIMITS["Business"].maxTx;
            const vip = KYC_LIMITS["VIP"].maxTx;

            expect(basic).toBeGreaterThan(unverified);
            expect(standard).toBeGreaterThan(basic);
            expect(business).toBeGreaterThan(standard);
            expect(vip).toBeGreaterThan(business);
        });
    });
});
