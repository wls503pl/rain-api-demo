import api from "../src/services/api";

describe("Rain Cards Flow - Integration Tests", () => {
    // Mock fetch before each test
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    // Restore mocks after each test
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should complete full signup -> card creation -> get cards flow", async () => {
        // Step 1: Mock signup API success response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    id: "app_001",
                    status: "pending",
                },
            }),
        });

        const signupResult = await api.initiateUserApplication(
            "John",
            "Doe",
            "john@example.com",
            "0x123"
        );

        expect(signupResult.success).toBe(true);
        const appId = signupResult.data.id;

        // Step 2: Mock create card API success response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    id: "card_001",
                    application_id: appId,
                },
            }),
        });

        const cardResult = await api.createCard(appId, "virtual", 1);

        expect(cardResult.success).toBe(true);

        // Step 3: Mock get cards API success response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    {
                        id: "card_001",
                        type: "virtual",
                    },
                ],
            }),
        });

        const cardsResult = await api.getCards(appId);

        expect(cardsResult.success).toBe(true);
    });

    it("should handle errors at any step", async () => {
        // Mock API error response
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                message: "Email already exists",
            }),
        });

        const result = await api.initiateUserApplication(
            "John",
            "Doe",
            "john@example.com",
            undefined
        );

        // Expect failure when API returns error
        expect(result.success).toBe(false);
    });
});
