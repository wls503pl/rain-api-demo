import React, { useState } from "react";
import { useRainAPI } from "../hooks/useRainAPI";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CardPage({ applicationId, onNext }) {
    const { loading, error, applyCard, clearError } = useRainAPI();
    const [cardType, setCardType] = useState("virtual");
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        const result = await applyCard(applicationId, cardType, quantity);

        if (result.success) {
            onNext();
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
                    <div
                        style={{
                            display: "inline-block",
                            backgroundColor: "#dbeafe",
                            borderRadius: "9999px",
                            padding: "16px",
                            marginBottom: "16px",
                        }}
                    >
                        <span style={{ fontSize: "48px" }}>💳</span>
                    </div>
                    <h1
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#111827",
                            marginBottom: "8px",
                        }}
                    >
                        Request Card
                    </h1>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                        Step 2: Choose Your Card Type
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
                        gap: "24px",
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "12px",
                            }}
                        >
                            Card Type
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        cardType === "virtual"
                                            ? "#eff6ff"
                                            : "white",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="cardType"
                                    value="virtual"
                                    checked={cardType === "virtual"}
                                    onChange={(e) =>
                                        setCardType(e.target.value)
                                    }
                                    disabled={loading}
                                    style={{ marginRight: "12px" }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontWeight: "600",
                                            color: "#111827",
                                        }}
                                    >
                                        Virtual Card
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Instant, Digital
                                    </p>
                                </div>
                            </label>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    backgroundColor:
                                        cardType === "physical"
                                            ? "#eff6ff"
                                            : "white",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="cardType"
                                    value="physical"
                                    checked={cardType === "physical"}
                                    onChange={(e) =>
                                        setCardType(e.target.value)
                                    }
                                    disabled={loading}
                                    style={{ marginRight: "12px" }}
                                />
                                <div>
                                    <p
                                        style={{
                                            fontWeight: "600",
                                            color: "#111827",
                                        }}
                                    >
                                        Physical Card
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Delivered to you
                                    </p>
                                </div>
                            </label>
                        </div>
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
                            Quantity: {quantity}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(parseInt(e.target.value))
                            }
                            disabled={loading}
                            style={{ width: "100%" }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                color: "#6b7280",
                                marginTop: "8px",
                            }}
                        >
                            <span>1</span>
                            <span>10</span>
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "8px",
                            padding: "16px",
                        }}
                    >
                        <p style={{ fontSize: "14px", color: "#374151" }}>
                            <span style={{ fontWeight: "600" }}>Summary:</span>{" "}
                            {quantity} {cardType} card(s)
                        </p>
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
                        {loading ? <LoadingSpinner /> : "Apply for Card"}
                    </button>
                </form>
            </div>
        </div>
    );
}
