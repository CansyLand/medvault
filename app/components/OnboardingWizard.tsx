"use client";

import { useState } from "react";
import { ShieldIcon } from "./Icons";
import type { EntityRole } from "../lib/api";
import type { PatientProfile, ProviderProfile } from "../types/medical";
import { PatientOnboarding } from "./onboarding/PatientOnboarding";
import { ProviderOnboarding } from "./onboarding/ProviderOnboarding";

interface OnboardingWizardProps {
  role: EntityRole;
  onComplete: (profile: PatientProfile | ProviderProfile) => Promise<void>;
  isSubmitting?: boolean;
}

export function OnboardingWizard({ role, onComplete, isSubmitting }: OnboardingWizardProps) {
  const isPatient = role === "patient";
  const totalSteps = isPatient ? 5 : 4;
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepLabels = isPatient
    ? ["Basic Info", "Contact", "Emergency", "Medical", "Insurance"]
    : ["Personal", "Organization", "Credentials", "Contact"];

  return (
    <main className="onboarding-page">
      <div className="onboarding-container">
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <h1 className="font-merriweather">Welcome to MedVault</h1>
          <p className="onboarding-subtitle">
            {isPatient
              ? "Let's set up your personal health vault"
              : "Let's set up your healthcare provider account"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="onboarding-progress">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            
            return (
              <div
                key={label}
                className={`progress-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
              >
                <div className="step-indicator">
                  {isCompleted ? "✓" : stepNum}
                </div>
                <span className="step-label">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="onboarding-content">
          {isPatient ? (
            <PatientOnboarding
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={onComplete}
              isSubmitting={isSubmitting}
            />
          ) : (
            <ProviderOnboarding
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={onComplete}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </main>
  );
}
