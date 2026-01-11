import api from "../src/services/api";

// Test suite for Rain API service
describe("Rain API Service", () => {
    // Mock fetch before each test
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    // Restore mocks after each test
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("initiateUserApplication", () => {
        it("should send POST request with correct body", async () => {
            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: { id: "app_123" },
                }),
            });

            const result = await api.initiateUserApplication(
                "John",
                "Doe",
                "john@example.com",
                "0x123"
            );

            // Verify correct endpoint and method
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(
                    "/applications/initiate-user-application"
                ),
                expect.objectContaining({
                    method: "POST",
                })
            );

            expect(result.success).toBe(true);
            expect(result.data.id).toBe("app_123");
        });

        it("should handle API errors", async () => {
            // Mock failed API response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    message: "Invalid email",
                }),
            });

            const result = await api.initiateUserApplication(
                "John",
                "Doe",
                "invalid",
                undefined
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("Invalid email");
        });
    });

    describe("createCard", () => {
        it("should send POST request with card data", async () => {
            // Mock successful card creation
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: { id: "card_123" },
                }),
            });

            const result = await api.createCard("app_123", "virtual", 1);

            // Verify correct endpoint and method
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/cards/create-card"),
                expect.objectContaining({
                    method: "POST",
                })
            );

            expect(result.success).toBe(true);
        });
    });

    describe("getCards", () => {
        it("should fetch cards for application", async () => {
            // Mock list of cards
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        { id: "card_1", type: "virtual" },
                        { id: "card_2", type: "physical" },
                    ],
                }),
            });

            const result = await api.getCards("app_123");

            // Verify correct endpoint and method
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("/cards/get-cards"),
                expect.objectContaining({
                    method: "GET",
                })
            );

            expect(result.success).toBe(true);
        });
    });
});
