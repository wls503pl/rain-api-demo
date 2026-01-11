import React, { useEffect, useState } from "react";
import { useRainAPI } from "../hooks/useRainAPI";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CardsListPage({ applicationId, onReset }) {
    const { loading, error, getCardsList } = useRainAPI();
    const [cards, setCards] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchCards = async () => {
            const result = await getCardsList(applicationId);
            if (result.success) {
                setCards(result.cards);
            }
            setLoaded(true);
        };

        fetchCards();
    }, [applicationId, getCardsList]);

    const mockCards = [
        {
            id: "card_001",
            type: "virtual",
            status: "active",
            last4: "4242",
            expiry: "12/26",
            balance: "1,000.00",
            currency: "USDC",
            createdAt: "2024-01-15",
        },
        {
            id: "card_002",
            type: "physical",
            status: "pending",
            last4: "5555",
            expiry: "12/26",
            balance: "500.00",
            currency: "USDT",
            createdAt: "2024-01-15",
        },
    ];

    const displayCards = cards.length > 0 ? cards : mockCards;

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(to bottom right, #3b82f6, #2563eb)",
                padding: "16px",
            }}
        >
            <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1
                        style={{
                            fontSize: "36px",
                            fontWeight: "bold",
                            color: "white",
                            marginBottom: "8px",
                        }}
                    >
                        Your Cards
                    </h1>
                    <p style={{ color: "#dbeafe" }}>
                        Step 3: Manage Your Stablecoin Cards
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
                        <p style={{ color: "#dc2626", fontWeight: "bold" }}>
                            {error}
                        </p>
                    </div>
                )}

                {loading && !loaded ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: "48px",
                        }}
                    >
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div style={{ marginBottom: "32px" }}>
                        {displayCards.map((card) => (
                            <div
                                key={card.id}
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "16px",
                                    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
                                    padding: "24px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div>
                                        <h3
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: "bold",
                                                color: "#111827",
                                            }}
                                        >
                                            {card.type === "virtual"
                                                ? "💳 Virtual Card"
                                                : "🏦 Physical Card"}
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: "14px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            {card.id}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "9999px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            backgroundColor:
                                                card.status === "active"
                                                    ? "#dcfce7"
                                                    : "#fef3c7",
                                            color:
                                                card.status === "active"
                                                    ? "#166534"
                                                    : "#92400e",
                                        }}
                                    >
                                        {card.status.charAt(0).toUpperCase() +
                                            card.status.slice(1)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "16px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Card Number
                                        </p>
                                        <p
                                            style={{
                                                fontFamily: "monospace",
                                                fontWeight: "bold",
                                                color: "#111827",
                                            }}
                                        >
                                            •••• {card.last4}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Expiry
                                        </p>
                                        <p
                                            style={{
                                                fontFamily: "monospace",
                                                fontWeight: "bold",
                                                color: "#111827",
                                            }}
                                        >
                                            {card.expiry}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Balance
                                        </p>
                                        <p
                                            style={{
                                                fontWeight: "bold",
                                                color: "#111827",
                                            }}
                                        >
                                            {card.balance} {card.currency}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Created
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "14px",
                                                color: "#111827",
                                            }}
                                        >
                                            {card.createdAt}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#dbeafe",
                                            color: "#2563eb",
                                            fontWeight: "600",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#f3f4f6",
                                            color: "#374151",
                                            fontWeight: "600",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", gap: "16px" }}>
                    <button
                        onClick={onReset}
                        style={{
                            flex: 1,
                            backgroundColor: "white",
                            color: "#2563eb",
                            fontWeight: "bold",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Apply Another Card
                    </button>
                    <button
                        style={{
                            flex: 1,
                            backgroundColor: "white",
                            color: "#2563eb",
                            fontWeight: "bold",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
