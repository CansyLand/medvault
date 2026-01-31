"use client";

import { useState } from "react";
import type { PatientProfile } from "../../types/medical";
import { createDefaultPatientProfile } from "../../types/medical";

interface PatientOnboardingProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: (profile: PatientProfile) => Promise<void>;
  isSubmitting?: boolean;
}

export function PatientOnboarding({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onComplete,
  isSubmitting,
}: PatientOnboardingProps) {
  const [profile, setProfile] = useState<PatientProfile>(createDefaultPatientProfile());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfile = <K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updateAddress = (key: keyof PatientProfile["address"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateEmergencyContact = (key: keyof PatientProfile["emergencyContact"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateInsurance = (key: keyof PatientProfile["insurance"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      insurance: { ...prev.insurance, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.firstName.trim()) newErrors.firstName = "First name is required";
    if (!profile.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!profile.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.email.trim()) newErrors.email = "Email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let valid = true;
    if (currentStep === 1) valid = validateStep1();
    else if (currentStep === 2) valid = validateStep2();
    
    if (valid) onNext();
  };

  const handleComplete = async () => {
    const finalProfile: PatientProfile = {
      ...profile,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };
    await onComplete(finalProfile);
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="onboarding-form">
      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div className="form-step">
          <h2>Basic Information</h2>
          <p className="form-step-desc">Tell us a bit about yourself</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                value={profile.firstName}
                onChange={(e) => updateProfile("firstName", e.target.value)}
                placeholder="John"
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                value={profile.lastName}
                onChange={(e) => updateProfile("lastName", e.target.value)}
                placeholder="Doe"
              />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => updateProfile("dateOfBirth", e.target.value)}
              />
              {errors.dateOfBirth && <span className="form-error">{errors.dateOfBirth}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) => updateProfile("gender", e.target.value as PatientProfile["gender"])}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contact Info */}
      {currentStep === 2 && (
        <div className="form-step">
          <h2>Contact Information</h2>
          <p className="form-step-desc">How can we reach you?</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                placeholder="john.doe@example.com"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => updateProfile("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="street">Street Address</label>
            <input
              id="street"
              type="text"
              value={profile.address.street}
              onChange={(e) => updateAddress("street", e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                value={profile.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                placeholder="San Francisco"
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                value={profile.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                placeholder="CA"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                id="zipCode"
                type="text"
                value={profile.address.zipCode}
                onChange={(e) => updateAddress("zipCode", e.target.value)}
                placeholder="94102"
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                value={profile.address.country}
                onChange={(e) => updateAddress("country", e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Emergency Contact */}
      {currentStep === 3 && (
        <div className="form-step">
          <h2>Emergency Contact</h2>
          <p className="form-step-desc">Who should we contact in case of emergency?</p>

          <div className="form-group">
            <label htmlFor="emergencyName">Contact Name</label>
            <input
              id="emergencyName"
              type="text"
              value={profile.emergencyContact.name}
              onChange={(e) => updateEmergencyContact("name", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergencyRelationship">Relationship</label>
              <input
                id="emergencyRelationship"
                type="text"
                value={profile.emergencyContact.relationship}
                onChange={(e) => updateEmergencyContact("relationship", e.target.value)}
                placeholder="Spouse"
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyPhone">Phone Number</label>
              <input
                id="emergencyPhone"
                type="tel"
                value={profile.emergencyContact.phone}
                onChange={(e) => updateEmergencyContact("phone", e.target.value)}
                placeholder="+1 (555) 987-6543"
              />
            </div>
          </div>

          <div className="form-note">
            <p>This information will only be used in medical emergencies and is stored encrypted in your vault.</p>
          </div>
        </div>
      )}

      {/* Step 4: Medical Info */}
      {currentStep === 4 && (
        <div className="form-step">
          <h2>Medical Information</h2>
          <p className="form-step-desc">Important health details for your records</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bloodType">Blood Type</label>
              <select
                id="bloodType"
                value={profile.bloodType}
                onChange={(e) => updateProfile("bloodType", e.target.value)}
              >
                <option value="">Select blood type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="primaryPhysician">Primary Physician</label>
              <input
                id="primaryPhysician"
                type="text"
                value={profile.primaryPhysician}
                onChange={(e) => updateProfile("primaryPhysician", e.target.value)}
                placeholder="Dr. Smith"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Known Allergies</label>
            <input
              id="allergies"
              type="text"
              value={profile.allergies.join(", ")}
              onChange={(e) => updateProfile("allergies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="Penicillin, Peanuts (comma-separated)"
            />
            <span className="form-hint">Separate multiple allergies with commas</span>
          </div>
        </div>
      )}

      {/* Step 5: Insurance */}
      {currentStep === 5 && (
        <div className="form-step">
          <h2>Insurance Information</h2>
          <p className="form-step-desc">Your health insurance details (optional)</p>

          <div className="form-group">
            <label htmlFor="insuranceProvider">Insurance Provider</label>
            <input
              id="insuranceProvider"
              type="text"
              value={profile.insurance.provider}
              onChange={(e) => updateInsurance("provider", e.target.value)}
              placeholder="Blue Cross Blue Shield"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="policyNumber">Policy Number</label>
              <input
                id="policyNumber"
                type="text"
                value={profile.insurance.policyNumber}
                onChange={(e) => updateInsurance("policyNumber", e.target.value)}
                placeholder="ABC123456789"
              />
            </div>
            <div className="form-group">
              <label htmlFor="groupNumber">Group Number</label>
              <input
                id="groupNumber"
                type="text"
                value={profile.insurance.groupNumber}
                onChange={(e) => updateInsurance("groupNumber", e.target.value)}
                placeholder="GRP001"
              />
            </div>
          </div>

          <div className="form-note success">
            <p>You&apos;re all set! Click &quot;Complete Setup&quot; to enter your secure health vault.</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="onboarding-nav">
        {currentStep > 1 && (
          <button type="button" className="secondary" onClick={onBack} disabled={isSubmitting}>
            Back
          </button>
        )}
        <div className="nav-spacer" />
        {currentStep < totalSteps && (
          <button type="button" className="skip" onClick={onNext}>
            Skip
          </button>
        )}
        {isLastStep ? (
          <button type="button" onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Complete Setup"}
          </button>
        ) : (
          <button type="button" onClick={handleNext}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
