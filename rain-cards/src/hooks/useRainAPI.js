import { useState, useCallback } from "react";
import api from "../services/api";

// Custom hook that wraps all Rain API logic for the UI
export const useRainAPI = () => {
    // Global loading state for API calls
    const [loading, setLoading] = useState(false);

    // Global error state
    const [error, setError] = useState(null);

    // Step 1: User signup
    const signup = useCallback(
        async (firstName, lastName, email, walletAddress) => {
            setLoading(true);
            setError(null);

            const result = await api.initiateUserApplication(
                firstName,
                lastName,
                email,
                walletAddress
            );

            if (result.success) {
                setLoading(false);
                return { success: true, applicationId: result.data.id };
            } else {
                setError(result.error);
                setLoading(false);
                return { success: false, error: result.error };
            }
        },
        []
    );

    // Check application status
    const checkApplication = useCallback(async (applicationId) => {
        setLoading(true);
        setError(null);

        const result = await api.getUserApplication(applicationId);

        if (result.success) {
            setLoading(false);
            return { success: true, application: result.data };
        } else {
            setError(result.error);
            setLoading(false);
            return { success: false, error: result.error };
        }
    }, []);

    // Step 2: Apply for card(s)
    const applyCard = useCallback(
        async (applicationId, type = "virtual", quantity = 1) => {
            setLoading(true);
            setError(null);

            const result = await api.createCard(applicationId, type, quantity);

            if (result.success) {
                setLoading(false);
                return { success: true, cardId: result.data.id };
            } else {
                setError(result.error);
                setLoading(false);
                return { success: false, error: result.error };
            }
        },
        []
    );

    // Step 3: Get all cards for the user
    const getCardsList = useCallback(async (applicationId) => {
        setLoading(true);
        setError(null);

        const result = await api.getCards(applicationId);

        if (result.success) {
            setLoading(false);
            return {
                success: true,
                // Always return an array for UI safety
                cards: Array.isArray(result.data) ? result.data : [result.data],
            };
        } else {
            setError(result.error);
            setLoading(false);
            return { success: false, error: result.error };
        }
    }, []);

    // Clear error manually (e.g. when closing alert)
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Expose everything to components
    return {
        loading,
        error,
        signup,
        checkApplication,
        applyCard,
        getCardsList,
        clearError,
    };
};
