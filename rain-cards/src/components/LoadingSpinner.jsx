export default function LoadingSpinner() {
    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div
                style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out both",
                }}
            ></div>
            <div
                style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out both",
                    animationDelay: "0.2s",
                }}
            ></div>
            <div
                style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out both",
                    animationDelay: "0.4s",
                }}
            ></div>
            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
