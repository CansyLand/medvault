"use client";

import { CopyableEntityId } from "./CopyableEntityId";

type SettingsSectionProps = {
  entityId: string | null;
  onReset: () => Promise<unknown>;
  disabled: boolean;
  isResetting: boolean;
};

export function SettingsSection({ entityId, onReset, disabled, isResetting }: SettingsSectionProps) {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Settings</h2>
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
