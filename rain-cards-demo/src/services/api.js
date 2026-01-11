// Read API config from environment variables
// Fallback to default values for local development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const API_KEY = process.env.REACT_APP_API_KEY || "test-api-key";

/**
 * RainAPI
 * A small client to handle all API requests in one place
 */
class RainAPI {
    constructor(baseURL = API_BASE_URL, apiKey = API_KEY) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
    }

    /**
     * Generic request method used by all APIs
     * @param {string} endpoint - API path (e.g. "/cards/create-card")
     * @param {string} method - HTTP method (GET, POST)
     * @param {object|null} body - Request payload for POST
     */
    async request(endpoint, method = "GET", body = null) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };

        const options = {
            method,
            headers,
        };

        // Add request body if provided
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            // Handle non-2xx responses as errors
            if (!response.ok) {
                throw new Error(
                    data.message || `API Error: ${response.status}`
                );
            }

            // Unified success response
            return {
                success: true,
                data: data.data || data,
                status: response.status,
            };
        } catch (error) {
            // Unified error response
            return {
                success: false,
                error: error.message,
                status: null,
            };
        }
    }

    /**
     * Step 1: Create user application
     */
    async initiateUserApplication(firstName, lastName, email, walletAddress) {
        return this.request("/applications/initiate-user-application", "POST", {
            first_name: firstName,
            last_name: lastName,
            email,
            wallet_address: walletAddress,
        });
    }

    /**
     * Get application info by ID
     */
    async getUserApplication(applicationId) {
        return this.request(
            `/applications/get-user-application/${applicationId}`,
            "GET"
        );
    }

    /**
     * Step 2: Create cards for the user
     */
    async createCard(applicationId, type = "virtual", quantity = 1) {
        return this.request("/cards/create-card", "POST", {
            application_id: applicationId,
            type,
            quantity,
        });
    }

    /**
     * Step 3: Get all cards for the user
     */
    async getCards(applicationId) {
        return this.request(
            `/cards/get-cards?application_id=${applicationId}`,
            "GET"
        );
    }

    /**
     * Get single card details
     */
    async getCardDetail(cardId) {
        return this.request(`/cards/get-card/${cardId}`, "GET");
    }
}

// Export a shared API instance
export default new RainAPI();
