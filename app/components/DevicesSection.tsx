"use client";

import { useState } from "react";
import { DeviceIcon } from "./Icons";

type DevicesSectionProps = {
  generatedInvite: { code: string; expiresAt: number } | null;
  onGenerateInvite: () => Promise<unknown>;
  onLinkDevice: (code: string) => Promise<unknown>;
  disabled: boolean;
  isGenerating: boolean;
  isLinking: boolean;
};

export function DevicesSection({
  generatedInvite,
  onGenerateInvite,
  onLinkDevice,
  disabled,
  isGenerating,
  isLinking,
}: DevicesSectionProps) {
  const [inviteCode, setInviteCode] = useState("");

  const handleLinkDevice = async () => {
    if (!inviteCode.trim()) return;
    await onLinkDevice(inviteCode);
    setInviteCode("");
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Device Management</h2>
      </div>
      <p className="section-desc">
        Link multiple devices to your vault. All devices share the same encrypted medical records.
      </p>

      {/* Generate invite */}
      <div className="subsection">
        <h3>Add Another Device</h3>
        <p className="subsection-desc">
          Generate a secure invite code to link your phone, tablet, or another computer to this vault.
        </p>
        <button onClick={onGenerateInvite} disabled={disabled || isGenerating}>
          {isGenerating ? "Generating..." : "Generate Device Code"}
        </button>
        {generatedInvite && (
          <div className="invite-code-box">
            <span className="invite-code-label">Device linking code:</span>
            <code className="invite-code">{generatedInvite.code}</code>
            <span className="invite-code-expires">
              Expires at {new Date(generatedInvite.expiresAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Link to another entity */}
      <div className="subsection">
        <h3>Link to Different Vault</h3>
        <p className="subsection-desc">
          Enter an invite code to link this device to a different MedVault account.
        </p>
        <div className="link-form">
          <input
            type="text"
            placeholder="Enter device code..."
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={disabled}
          />
          <button
            onClick={handleLinkDevice}
            disabled={disabled || !inviteCode.trim() || isLinking}
          >
            {isLinking ? "Linking..." : "Link Device"}
          </button>
        </div>
      </div>
    </div>
  );
}
