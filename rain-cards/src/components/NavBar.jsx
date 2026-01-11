export default function NavBar({ currentStep, totalSteps }) {
    return (
        <nav
            style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                padding: "16px 24px",
                marginBottom: "32px",
            }}
        >
            <div
                style={{
                    maxWidth: "1024px",
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span style={{ fontSize: "24px" }}>🌧️</span>
                    <span
                        style={{
                            fontWeight: "bold",
                            fontSize: "20px",
                            color: "#111827",
                        }}
                    >
                        Rain Cards
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#4b5563" }}>
                        Step {currentStep} of {totalSteps}
                    </span>
                    <div
                        style={{
                            width: "128px",
                            height: "8px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "9999px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                backgroundColor: "#3b82f6",
                                width: `${(currentStep / totalSteps) * 100}%`,
                                transition: "width 0.3s ease",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
