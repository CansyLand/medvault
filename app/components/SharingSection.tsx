"use client";

import { useState } from "react";
import type { SharesResponse } from "../lib/api";
import type { SharedPropertyValue } from "../hooks/useEventStream";
import { CopyableEntityId } from "./CopyableEntityId";
import { ShareIcon } from "./Icons";

type SharingSectionProps = {
  properties: Record<string, string>;
  shares: SharesResponse;
  sharedData: SharedPropertyValue[];
  onCreateShare: (propertyName: string) => Promise<unknown>;
  onAcceptShare: (code: string) => Promise<unknown>;
  onRemoveShare: (params: { targetEntityId?: string; sourceEntityId?: string; propertyName: string }) => Promise<unknown>;
  generatedShare: { code: string; propertyName: string; expiresAt: number } | null;
  disabled: boolean;
  isCreating: boolean;
  isAccepting: boolean;
};

export function SharingSection({
  properties,
  shares,
  sharedData,
  onCreateShare,
  onAcceptShare,
  onRemoveShare,
  generatedShare,
  disabled,
  isCreating,
  isAccepting,
}: SharingSectionProps) {
  const [selectedProperty, setSelectedProperty] = useState("");
  const [shareCode, setShareCode] = useState("");

  const propertyKeys = Object.keys(properties).sort();

  const handleCreateShare = async () => {
    if (!selectedProperty) return;
    await onCreateShare(selectedProperty);
    setSelectedProperty("");
  };

  const handleAcceptShare = async () => {
    if (!shareCode.trim()) return;
    await onAcceptShare(shareCode);
    setShareCode("");
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Data Sharing</h2>
      </div>
      <p className="section-desc">
        Securely share specific medical records with healthcare providers. They'll receive real-time updates with end-to-end encryption.
      </p>

      {/* Share a property */}
      <div className="subsection">
        <h3>Share a Medical Record</h3>
        <div className="share-form">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            disabled={disabled || propertyKeys.length === 0}
          >
            <option value="">Select record...</option>
            {propertyKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateShare}
            disabled={disabled || !selectedProperty || isCreating}
          >
            {isCreating ? "Creating..." : "Generate Share Code"}
          </button>
        </div>
        {generatedShare && (
          <div className="share-code-box">
            <span className="share-code-label">Share code for {generatedShare.propertyName}:</span>
            <code className="share-code">{generatedShare.code}</code>
            <span className="share-code-expires">
              Expires at {new Date(generatedShare.expiresAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Accept a share */}
      <div className="subsection">
        <h3>Receive Shared Data</h3>
        <div className="share-form">
          <input
            type="text"
            placeholder="Enter share code from provider..."
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value)}
            disabled={disabled}
          />
          <button
            onClick={handleAcceptShare}
            disabled={disabled || !shareCode.trim() || isAccepting}
          >
            {isAccepting ? "Accepting..." : "Accept Share"}
          </button>
        </div>
      </div>

      {/* Outgoing shares */}
      {shares.outgoing.length > 0 && (
        <div className="subsection">
          <h3>Records You're Sharing</h3>
          <ul className="share-list">
            {shares.outgoing.map((share) => (
              <li key={`${share.targetEntityId}-${share.propertyName}`} className="share-item">
                <div className="share-info">
                  <span className="share-property">{share.propertyName}</span>
                  <span className="share-target">→ <CopyableEntityId entityId={share.targetEntityId} short /></span>
                </div>
                <button
                  className="small danger"
                  onClick={() => onRemoveShare({ targetEntityId: share.targetEntityId, propertyName: share.propertyName })}
                  disabled={disabled}
                >
                  Revoke Access
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Incoming shares */}
      {shares.incoming.length > 0 && (
        <div className="subsection">
          <h3>Records Shared With You</h3>
          <ul className="share-list incoming">
            {shares.incoming.map((share) => {
              const data = sharedData.find(
                (s) => s.sourceEntityId === share.sourceEntityId && s.propertyName === share.propertyName
              );
              return (
                <li key={`${share.sourceEntityId}-${share.propertyName}`} className="share-item">
                  <div className="share-info">
                    <span className="share-source"><CopyableEntityId entityId={share.sourceEntityId} short /></span>
                    <span className="share-property">{share.propertyName}</span>
                    <span className="share-value">{data?.value ?? "(syncing...)"}</span>
                  </div>
                  <button
                    className="small danger"
                    onClick={() => onRemoveShare({ sourceEntityId: share.sourceEntityId, propertyName: share.propertyName })}
                    disabled={disabled}
                  >
                    Unlink
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {shares.outgoing.length === 0 && shares.incoming.length === 0 && (
        <div className="empty-state">
          <ShareIcon className="w-12 h-12" style={{ opacity: 0.2 }} />
          <p>No active data shares</p>
          <span className="empty-hint">Share records with providers or receive shared data</span>
        </div>
      )}
    </div>
  );
}
