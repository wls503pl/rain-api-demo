import React, { useState } from "react";
import NavBar from "./components/NavBar";
import SignupPage from "./pages/SignupPage";
import CardPage from "./pages/CardPage";
import CardsListPage from "./pages/CardsListPage";

// Main app component controlling page flow
export default function App() {
    // Track current step (1, 2, 3)
    const [currentStep, setCurrentStep] = useState(1);

    // Store application ID between steps
    const [applicationId, setApplicationId] = useState(null);

    // Move from signup to card step
    const handleSignupNext = (appId) => {
        setApplicationId(appId);
        setCurrentStep(2);
    };

    // Move from card step to cards list
    const handleCardNext = () => {
        setCurrentStep(3);
    };

    // Reset app back to step 1
    const handleReset = () => {
        setApplicationId(null);
        setCurrentStep(1);
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
            {/* Top navigation with progress */}
            <NavBar currentStep={currentStep} totalSteps={3} />

            {/* Step 1: Signup */}
            {currentStep === 1 && <SignupPage onNext={handleSignupNext} />}

            {/* Step 2: Card application */}
            {currentStep === 2 && (
                <CardPage
                    applicationId={applicationId}
                    onNext={handleCardNext}
                />
            )}

            {/* Step 3: Cards list */}
            {currentStep === 3 && (
                <CardsListPage
                    applicationId={applicationId}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}
