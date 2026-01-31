"use client";

import { useState } from "react";
import type { ProviderProfile, OrganizationType } from "../../types/medical";
import { createDefaultProviderProfile } from "../../types/medical";

interface ProviderOnboardingProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: (profile: ProviderProfile) => Promise<void>;
  isSubmitting?: boolean;
  initialProfile?: ProviderProfile;
}

export function ProviderOnboarding({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onComplete,
  isSubmitting,
  initialProfile,
}: ProviderOnboardingProps) {
  const [profile, setProfile] = useState<ProviderProfile>(
    initialProfile || createDefaultProviderProfile()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateProfile = <K extends keyof ProviderProfile>(key: K, value: ProviderProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updateAddress = (key: keyof ProviderProfile["facilityAddress"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      facilityAddress: { ...prev.facilityAddress, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.firstName.trim()) newErrors.firstName = "First name is required";
    if (!profile.lastName.trim()) newErrors.lastName = "Last name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.organizationName.trim()) newErrors.organizationName = "Organization name is required";
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
    const finalProfile: ProviderProfile = {
      ...profile,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };
    await onComplete(finalProfile);
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="onboarding-form">
      {/* Step 1: Personal Info */}
      {currentStep === 1 && (
        <div className="form-step">
          <h2>Personal Information</h2>
          <p className="form-step-desc">Tell us about yourself</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <select
                id="title"
                value={profile.title}
                onChange={(e) => updateProfile("title", e.target.value)}
              >
                <option value="">Select title</option>
                <option value="Dr.">Dr.</option>
                <option value="MD">MD</option>
                <option value="DO">DO</option>
                <option value="NP">NP</option>
                <option value="PA">PA</option>
                <option value="RN">RN</option>
                <option value="Prof.">Prof.</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
              </select>
            </div>
            <div className="form-group flex-2">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                value={profile.firstName}
                onChange={(e) => updateProfile("firstName", e.target.value)}
                placeholder="Jane"
              />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              id="lastName"
              type="text"
              value={profile.lastName}
              onChange={(e) => updateProfile("lastName", e.target.value)}
              placeholder="Smith"
            />
            {errors.lastName && <span className="form-error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="specialty">Medical Specialty</label>
            <input
              id="specialty"
              type="text"
              value={profile.specialty}
              onChange={(e) => updateProfile("specialty", e.target.value)}
              placeholder="Cardiology, General Practice, etc."
            />
          </div>
        </div>
      )}

      {/* Step 2: Organization */}
      {currentStep === 2 && (
        <div className="form-step">
          <h2>Organization Details</h2>
          <p className="form-step-desc">Information about your practice or facility</p>

          <div className="form-group">
            <label htmlFor="organizationName">Organization / Practice Name *</label>
            <input
              id="organizationName"
              type="text"
              value={profile.organizationName}
              onChange={(e) => updateProfile("organizationName", e.target.value)}
              placeholder="Memorial Hospital, Smith Family Practice, etc."
            />
            {errors.organizationName && <span className="form-error">{errors.organizationName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="organizationType">Organization Type</label>
            <select
              id="organizationType"
              value={profile.organizationType}
              onChange={(e) => updateProfile("organizationType", e.target.value as OrganizationType)}
            >
              <option value="private_practice">Private Practice</option>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="laboratory">Laboratory</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Credentials */}
      {currentStep === 3 && (
        <div className="form-step">
          <h2>Professional Credentials</h2>
          <p className="form-step-desc">Your professional licensing information</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseNumber">License Number</label>
              <input
                id="licenseNumber"
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => updateProfile("licenseNumber", e.target.value)}
                placeholder="MD12345"
              />
            </div>
            <div className="form-group">
              <label htmlFor="npiNumber">NPI Number</label>
              <input
                id="npiNumber"
                type="text"
                value={profile.npiNumber}
                onChange={(e) => updateProfile("npiNumber", e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="accreditations">Accreditations / Certifications</label>
            <input
              id="accreditations"
              type="text"
              value={profile.accreditations.join(", ")}
              onChange={(e) => updateProfile("accreditations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="Board Certified, HIPAA Certified (comma-separated)"
            />
            <span className="form-hint">Separate multiple accreditations with commas</span>
          </div>

          <div className="form-note">
            <p>This information is stored securely and never shared without your consent.</p>
          </div>
        </div>
      )}

      {/* Step 4: Contact / Facility */}
      {currentStep === 4 && (
        <div className="form-step">
          <h2>Contact & Facility</h2>
          <p className="form-step-desc">How patients and other providers can reach you</p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                placeholder="dr.smith@hospital.com"
              />
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
            <label htmlFor="street">Facility Address</label>
            <input
              id="street"
              type="text"
              value={profile.facilityAddress.street}
              onChange={(e) => updateAddress("street", e.target.value)}
              placeholder="456 Medical Center Drive"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                value={profile.facilityAddress.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                placeholder="Boston"
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                value={profile.facilityAddress.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                placeholder="MA"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                id="zipCode"
                type="text"
                value={profile.facilityAddress.zipCode}
                onChange={(e) => updateAddress("zipCode", e.target.value)}
                placeholder="02115"
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                value={profile.facilityAddress.country}
                onChange={(e) => updateAddress("country", e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>

          <div className="form-note success">
            <p>You&apos;re all set! Click &quot;Complete Setup&quot; to start managing patient records securely.</p>
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
