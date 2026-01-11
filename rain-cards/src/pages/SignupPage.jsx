import React, { useState } from "react";
import { useRainAPI } from "../hooks/useRainAPI";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SignupPage({ onNext }) {
    const { loading, error, signup, clearError } = useRainAPI();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        walletAddress: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!formData.firstName || !formData.lastName || !formData.email) {
            alert("Please fill in all required fields");
            return;
        }

        const result = await signup(
            formData.firstName,
            formData.lastName,
            formData.email,
            formData.walletAddress || undefined
        );

        if (result.success) {
            onNext(result.applicationId);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(to bottom right, #3b82f6, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 20px 25px rgba(0,0,0,0.1)",
                    maxWidth: "448px",
                    width: "100%",
                    padding: "32px",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1
                        style={{
                            fontSize: "36px",
                            fontWeight: "bold",
                            color: "#2563eb",
                            marginBottom: "8px",
                        }}
                    >
                        Rain
                    </h1>
                    <p style={{ color: "#4b5563", marginBottom: "16px" }}>
                        Stablecoin Card Platform
                    </p>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                        Step 1: Register Your Account
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <p
                            style={{
                                color: "#dc2626",
                                fontWeight: "bold",
                                fontSize: "14px",
                            }}
                        >
                            {error}
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            First Name *
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            Last Name *
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "8px",
                            }}
                        >
                            Wallet Address (Optional)
                        </label>
                        <input
                            type="text"
                            name="walletAddress"
                            value={formData.walletAddress}
                            onChange={handleChange}
                            placeholder="0x..."
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "8px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "14px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            backgroundColor: loading ? "#9ca3af" : "#2563eb",
                            color: "white",
                            fontWeight: "bold",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        {loading ? <LoadingSpinner /> : "Register"}
                    </button>
                </form>

                <p
                    style={{
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "24px",
                    }}
                >
                    By registering, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}
