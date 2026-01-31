"use client";

import { useState, useMemo } from "react";
import type { SharesResponse } from "../lib/api";
import type { SharedPropertyValue } from "../hooks/useEventStream";
import { CopyableEntityId } from "./CopyableEntityId";
import { ShareIcon, ShieldIcon } from "./Icons";
import { explainMedicalRequest, generateRecordsSummary } from "../services/geminiService";
import {
  parseRecordFromProperty,
  getRecordTypeDisplayName,
  getRecordTypeIconClass,
  PropertyKeyPrefixes,
} from "../types/medical";

interface EnhancedSharingSectionProps {
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
}

export function EnhancedSharingSection({
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
}: EnhancedSharingSectionProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [shareCode, setShareCode] = useState("");
  const [purpose, setPurpose] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [sharingSummary, setSharingSummary] = useState<string | null>(null);

  // Parse medical records from properties
  const records = useMemo(() => {
    const result: Array<{ key: string; title: string; type: string }> = [];

    Object.entries(properties).forEach(([key, value]) => {
      if (key.startsWith(PropertyKeyPrefixes.RECORD)) {
        const record = parseRecordFromProperty(value);
        if (record) {
          result.push({
            key,
            title: record.title,
            type: record.type,
          });
        }
      } else if (!key.startsWith(PropertyKeyPrefixes.PDF)) {
        // Include simple properties too
        result.push({
          key,
          title: key,
          type: "other",
        });
      }
    });

    return result;
  }, [properties]);

  const handleRecordToggle = (key: string) => {
    setSelectedRecords((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map((r) => r.key));
    }
  };

  const handleCreateShare = async () => {
    if (selectedRecords.length === 0) return;

    // Generate AI summary of what's being shared
    const recordsToShare = selectedRecords.map((key) => ({
      key,
      value: properties[key]?.slice(0, 200) || "",
    }));
    
    const summary = await generateRecordsSummary(recordsToShare);
    setSharingSummary(summary);

    // Create shares for each selected record
    for (const key of selectedRecords) {
      await onCreateShare(key);
    }
  };

  const handleAcceptShare = async () => {
    if (!shareCode.trim()) return;
    await onAcceptShare(shareCode);
    setShareCode("");
  };

  const handleExplainRequest = async (share: { sourceEntityId: string; propertyName: string }) => {
    setLoadingExplanation(true);
    const explanation = await explainMedicalRequest({
      requester: `Entity ${share.sourceEntityId.slice(0, 8)}...`,
      purpose: "Shared medical data access",
      fields: [share.propertyName],
    });
    setAiExplanation(explanation);
    setLoadingExplanation(false);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Data Sharing</h2>
      </div>
      <p className="section-desc">
        Securely share encrypted medical records with healthcare providers.
        All data remains encrypted end-to-end.
      </p>

      {/* Share Records */}
      <div className="subsection">
        <h3>Share Medical Records</h3>
        <p className="subsection-desc">
          Select which records to share. Each share code is time-limited and can only be used once.
        </p>

        {records.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              background: "var(--bg-tertiary)",
              borderRadius: "12px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No records to share. Upload medical documents first.
          </div>
        ) : (
          <>
            {/* Record Selection */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Select Records ({selectedRecords.length}/{records.length})
                </span>
                <button className="small secondary" onClick={handleSelectAll}>
                  {selectedRecords.length === records.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {records.map((record) => (
                  <label
                    key={record.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      background: selectedRecords.includes(record.key)
                        ? "var(--mint-pale)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.key)}
                      onChange={() => handleRecordToggle(record.key)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--teal-deep)" }}
                    />
                    <div
                      className={`record-type-icon ${getRecordTypeIconClass(record.type as any)}`}
                      style={{ width: "32px", height: "32px", fontSize: "0.65rem" }}
                    >
                      {record.type.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{record.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Purpose Input */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                Purpose (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Cardiology consultation, Insurance claim..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* Share Button */}
            <button
              onClick={handleCreateShare}
              disabled={disabled || selectedRecords.length === 0 || isCreating}
              style={{ width: "100%" }}
            >
              {isCreating
                ? "Generating Share Codes..."
                : `Share ${selectedRecords.length} Record${selectedRecords.length !== 1 ? "s" : ""}`}
            </button>

            {/* Sharing Summary */}
            {sharingSummary && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "var(--mint-pale)",
                  borderRadius: "12px",
                  border: "1px solid var(--mint-secondary)",
                }}
              >
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--teal-deep)" }}>AI Summary:</strong> {sharingSummary}
                </p>
              </div>
            )}
          </>
        )}

        {/* Generated Share Code */}
        {generatedShare && (
          <div className="share-code-box" style={{ marginTop: "1rem" }}>
            <span className="share-code-label">Share code for {generatedShare.propertyName}:</span>
            <code className="share-code">{generatedShare.code}</code>
            <span className="share-code-expires">
              Expires at {new Date(generatedShare.expiresAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Accept a Share */}
      <div className="subsection">
        <h3>Receive Shared Data</h3>
        <p className="subsection-desc">
          Enter a share code from a healthcare provider to receive their shared data.
        </p>
        <div className="share-form">
          <input
            type="text"
            placeholder="Enter share code..."
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

      {/* Outgoing Shares */}
      {shares.outgoing.length > 0 && (
        <div className="subsection">
          <h3>Records You're Sharing</h3>
          <ul className="share-list">
            {shares.outgoing.map((share) => {
              const record = parseRecordFromProperty(properties[share.propertyName] || "");
              return (
                <li key={`${share.targetEntityId}-${share.propertyName}`} className="share-item">
                  <div className="share-info">
                    <span className="share-property">
                      {record?.title || share.propertyName}
                    </span>
                    <span className="share-target">
                      → <CopyableEntityId entityId={share.targetEntityId} short />
                    </span>
                  </div>
                  <button
                    className="small danger"
                    onClick={() =>
                      onRemoveShare({ targetEntityId: share.targetEntityId, propertyName: share.propertyName })
                    }
                    disabled={disabled}
                  >
                    Revoke Access
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Incoming Shares */}
      {shares.incoming.length > 0 && (
        <div className="subsection">
          <h3>Records Shared With You</h3>
          <ul className="share-list incoming">
            {shares.incoming.map((share) => {
              const data = sharedData.find(
                (s) => s.sourceEntityId === share.sourceEntityId && s.propertyName === share.propertyName
              );
              const record = data?.value ? parseRecordFromProperty(data.value) : null;

              return (
                <li key={`${share.sourceEntityId}-${share.propertyName}`} className="share-item">
                  <div className="share-info">
                    <span className="share-source">
                      <CopyableEntityId entityId={share.sourceEntityId} short />
                    </span>
                    <span className="share-property">
                      {record?.title || share.propertyName}
                    </span>
                    <span className="share-value">
                      {record?.summary?.slice(0, 50) || data?.value?.slice(0, 50) || "(syncing...)"}
                      {(record?.summary?.length || 0) > 50 ? "..." : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="small secondary"
                      onClick={() => handleExplainRequest(share)}
                      disabled={loadingExplanation}
                    >
                      Explain
                    </button>
                    <button
                      className="small danger"
                      onClick={() =>
                        onRemoveShare({ sourceEntityId: share.sourceEntityId, propertyName: share.propertyName })
                      }
                      disabled={disabled}
                    >
                      Unlink
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* AI Explanation */}
          {aiExplanation && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "var(--mint-pale)",
                borderRadius: "12px",
                border: "1px solid var(--mint-secondary)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <ShieldIcon className="w-4 h-4" style={{ color: "var(--teal-deep)" }} />
                <strong style={{ color: "var(--teal-deep)", fontSize: "0.85rem" }}>AI Privacy Explanation</strong>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {aiExplanation}
              </p>
              <button
                className="small secondary"
                onClick={() => setAiExplanation(null)}
                style={{ marginTop: "0.75rem" }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {shares.outgoing.length === 0 && shares.incoming.length === 0 && (
        <div className="empty-state">
          <ShareIcon className="w-12 h-12" style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
          <p>No active data shares</p>
          <span className="empty-hint">Share records with providers or receive shared data</span>
        </div>
      )}
    </div>
  );
}
