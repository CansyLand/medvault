"use client";

import { ShieldIcon } from "./Icons";

type LoginViewProps = {
  onLogin: () => void;
  isLoggingIn: boolean;
  supportsPasskeys: boolean;
};

export function LoginView({ onLogin, isLoggingIn, supportsPasskeys }: LoginViewProps) {
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
        <button
          className="login-btn"
          onClick={onLogin}
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
