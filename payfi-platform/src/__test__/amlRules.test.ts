import { detectStructuring, detectHighFrequency } from "../compliance/amlRules";

describe("AML Rules", () => {
    describe("Structuring Detection", () => {
        it("should detect structuring: multiple small transactions", () => {
            const transactions = [1000, 1000, 1000]; // 3 x 1000 = 3000
            const result = detectStructuring(transactions, 2500);

            expect(result).toBe(true);
        });

        it("should not flag legitimate single transaction", () => {
            const transactions = [5000]; // Single large transaction
            const result = detectStructuring(transactions, 2500);

            expect(result).toBe(false);
        });

        it("should not flag two small transactions", () => {
            const transactions = [500, 500]; // Only 2 transactions
            const result = detectStructuring(transactions, 2500);

            expect(result).toBe(false);
        });

        it("should flag exactly 3 transactions above threshold", () => {
            const transactions = [500, 500, 500]; // 3 x 500 = 1500
            const result = detectStructuring(transactions, 1000);

            expect(result).toBe(true);
        });

        it("should not flag if total below threshold", () => {
            const transactions = [100, 100, 100]; // Total 300
            const result = detectStructuring(transactions, 500);

            expect(result).toBe(false);
        });

        it("should detect multiple small deposits (classic structuring)", () => {
            const transactions = [999, 999, 999, 999]; // 4 x 999 = 3996
            const result = detectStructuring(transactions, 3000);

            expect(result).toBe(true);
        });
    });

    describe("High Frequency Detection", () => {
        it("should flag more than 5 transactions per minute", () => {
            const result = detectHighFrequency(6);

            expect(result).toBe(true);
        });

        it("should allow exactly 5 transactions per minute", () => {
            const result = detectHighFrequency(5);

            expect(result).toBe(false);
        });

        it("should allow less than 5 transactions per minute", () => {
            const result = detectHighFrequency(3);

            expect(result).toBe(false);
        });

        it("should flag 10 transactions per minute as suspicious", () => {
            const result = detectHighFrequency(10);

            expect(result).toBe(true);
        });
    });
});
