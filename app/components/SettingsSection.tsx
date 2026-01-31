"use client";

import { useState } from "react";
import { CopyableEntityId } from "./CopyableEntityId";
import { ShieldIcon, HeartIcon } from "./Icons";
import type { UserProfile, PatientProfile, ProviderProfile } from "../types/medical";
import { isPatientProfile, isProviderProfile, getDisplayName } from "../types/medical";
import type { EntityRole } from "../lib/api";

type SettingsSectionProps = {
  entityId: string | null;
  entityRole?: EntityRole | null;
  userProfile?: UserProfile | null;
  onReset: () => Promise<unknown>;
  onEditProfile?: () => void;
  disabled: boolean;
  isResetting: boolean;
};

export function SettingsSection({ 
  entityId, 
  entityRole,
  userProfile,
  onReset, 
  onEditProfile,
  disabled, 
  isResetting 
}: SettingsSectionProps) {
  const isDoctor = entityRole === "doctor";
  const isPatient = entityRole === "patient";

  // Render profile info based on type
  const renderProfileInfo = () => {
    if (!userProfile) return null;

    if (isProviderProfile(userProfile)) {
      return (
        <div className="profile-info-grid">
          <div className="profile-field">
            <span className="profile-label">Name</span>
            <span className="profile-value">{getDisplayName(userProfile)}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Organization</span>
            <span className="profile-value">{userProfile.organizationName || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Specialty</span>
            <span className="profile-value">{userProfile.specialty || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Email</span>
            <span className="profile-value">{userProfile.email || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Phone</span>
            <span className="profile-value">{userProfile.phone || "—"}</span>
          </div>
          {userProfile.licenseNumber && (
            <div className="profile-field">
              <span className="profile-label">License #</span>
              <span className="profile-value font-mono">{userProfile.licenseNumber}</span>
            </div>
          )}
          {userProfile.npiNumber && (
            <div className="profile-field">
              <span className="profile-label">NPI #</span>
              <span className="profile-value font-mono">{userProfile.npiNumber}</span>
            </div>
          )}
        </div>
      );
    }

    if (isPatientProfile(userProfile)) {
      return (
        <div className="profile-info-grid">
          <div className="profile-field">
            <span className="profile-label">Name</span>
            <span className="profile-value">{getDisplayName(userProfile)}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Date of Birth</span>
            <span className="profile-value">{userProfile.dateOfBirth || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Email</span>
            <span className="profile-value">{userProfile.email || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Phone</span>
            <span className="profile-value">{userProfile.phone || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Blood Type</span>
            <span className="profile-value">{userProfile.bloodType || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Primary Physician</span>
            <span className="profile-value">{userProfile.primaryPhysician || "—"}</span>
          </div>
          {userProfile.allergies && userProfile.allergies.length > 0 && (
            <div className="profile-field full-width">
              <span className="profile-label">Allergies</span>
              <span className="profile-value">{userProfile.allergies.join(", ")}</span>
            </div>
          )}
          {userProfile.emergencyContact?.name && (
            <div className="profile-field full-width">
              <span className="profile-label">Emergency Contact</span>
              <span className="profile-value">
                {userProfile.emergencyContact.name} ({userProfile.emergencyContact.relationship}) - {userProfile.emergencyContact.phone}
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Settings</h2>
      </div>

      {/* Personal Information */}
      <div className="subsection">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "32px",
              height: "32px",
              background: isDoctor ? "rgba(124, 58, 237, 0.1)" : "var(--mint)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {isDoctor ? (
                <ShieldIcon className="w-4 h-4" style={{ color: "var(--lavender-dark)" }} />
              ) : (
                <HeartIcon className="w-4 h-4" style={{ color: "var(--teal-deep)" }} />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{isDoctor ? "Practice Information" : "Personal Information"}</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                {isDoctor ? "Your organization's master data" : "Your personal health profile"}
              </p>
            </div>
          </div>
          {onEditProfile && (
            <button className="small secondary" onClick={onEditProfile} disabled={disabled}>
              Edit Profile
            </button>
          )}
        </div>

        {userProfile ? (
          <div style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem",
          }}>
            {renderProfileInfo()}
          </div>
        ) : (
          <div style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}>
            <p>No profile data available</p>
          </div>
        )}
      </div>

      {/* Entity info */}
      <div className="subsection">
        <h3>Vault Information</h3>
        <div className="info-grid">
          <span className="info-label">Vault ID</span>
          {entityId ? (
            <CopyableEntityId entityId={entityId} className="info-value" />
          ) : (
            <code className="info-value">—</code>
          )}
        </div>
        <p className="subsection-desc" style={{ marginTop: '0.75rem' }}>
          Your vault ID is a unique identifier for your encrypted health data. Share this ID with healthcare providers to receive data.
        </p>
      </div>

      {/* Security info */}
      <div className="subsection">
        <h3>Security</h3>
        <div className="card" style={{ background: 'var(--mint-pale)', border: '1px solid var(--mint-secondary)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--teal-deep)' }}>End-to-End Encrypted</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Your medical records are encrypted with XSalsa20-Poly1305 before leaving your device. 
            The server never sees your unencrypted data.
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="subsection danger-zone">
        <h3>Danger Zone</h3>
        <p className="subsection-desc">
          Reset will permanently delete all vault data, records, and shares from the server.
          Passkeys must be manually deleted from your browser settings.
        </p>
        <button className="danger" onClick={onReset} disabled={disabled || isResetting}>
          {isResetting ? "Resetting..." : "Delete All Vault Data"}
        </button>
      </div>
    </div>
  );
}
