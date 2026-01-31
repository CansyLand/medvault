"use client";

import { useState } from "react";
import { ShieldIcon } from "./Icons";
import type { EntityRole } from "../lib/api";

type LoginViewProps = {
  onLogin: (role: EntityRole) => void;
  isLoggingIn: boolean;
  supportsPasskeys: boolean;
};

export function LoginView({ onLogin, isLoggingIn, supportsPasskeys }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<EntityRole>("patient");

  const handleLogin = () => {
    onLogin(selectedRole);
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <h1 className="font-merriweather">MedVault</h1>
        </div>
        <p className="login-desc">
          End-to-end encrypted personal health data vault.
          <br />
          Your medical records never leave your device unencrypted.
        </p>

        {/* Role Selection */}
        <div className="role-selection">
          <p className="role-label">I am a:</p>
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${selectedRole === "patient" ? "active" : ""}`}
              onClick={() => setSelectedRole("patient")}
              disabled={isLoggingIn}
            >
              <span className="role-icon">🏥</span>
              <span className="role-text">Patient</span>
              <span className="role-desc">Store & control my medical records</span>
            </button>
            <button
              type="button"
              className={`role-btn ${selectedRole === "doctor" ? "active" : ""}`}
              onClick={() => setSelectedRole("doctor")}
              disabled={isLoggingIn}
            >
              <span className="role-icon">👨‍⚕️</span>
              <span className="role-text">Healthcare Provider</span>
              <span className="role-desc">Upload & transfer patient records</span>
            </button>
          </div>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={!supportsPasskeys || isLoggingIn}
        >
          {isLoggingIn ? "Signing in..." : "Sign in with Passkey"}
        </button>
        {!supportsPasskeys && (
          <p className="login-warning">
            Your browser doesn't support passkeys.
          </p>
        )}
        <p className="login-hint">
          First time? Your secure vault will be created automatically.
        </p>
      </div>
    </main>
  );
}
