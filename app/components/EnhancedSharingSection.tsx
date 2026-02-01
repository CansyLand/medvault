"use client";

import { useState, useMemo, useEffect } from "react";
import type { SharesResponse, EntityRole, DataRequest } from "../lib/api";
import type { SharedPropertyValue } from "../hooks/useEventStream";
import { CopyableEntityId } from "./CopyableEntityId";
import { ShareIcon, ShieldIcon, CheckIcon, HeartIcon } from "./Icons";
import { explainMedicalRequest } from "../services/geminiService";
import {
  parseRecordFromProperty,
  getRecordTypeIconClass,
  PropertyKeyPrefixes,
} from "../types/medical";
import { AccessRequestsPanel } from "./AccessRequestsPanel";

type SharingTab = "share" | "receive" | "requests";

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
  // Role-based features
  entityRole?: EntityRole | null;
  onTransferRecords?: (targetEntityId: string, propertyNames: string[]) => Promise<unknown>;
  isTransferring?: boolean;
  // Data requests (patient only)
  dataRequests?: DataRequest[];
  pendingRequestsCount?: number;
  onFulfillRequest?: (requestId: string, sharedPropertyNames: string[]) => Promise<void>;
  onDeclineRequest?: (requestId: string) => Promise<void>;
  isFulfillingRequest?: boolean;
  isDecliningRequest?: boolean;
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
  entityRole,
  onTransferRecords,
  isTransferring,
  dataRequests = [],
  pendingRequestsCount = 0,
  onFulfillRequest,
  onDeclineRequest,
  isFulfillingRequest,
  isDecliningRequest,
}: EnhancedSharingSectionProps) {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<SharingTab>("share");
  
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]); // For sharing
  const [selectedTransferRecords, setSelectedTransferRecords] = useState<string[]>([]); // For transfers
  const [shareCode, setShareCode] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  
  // Collapsible sections state
  const [incomingExpanded, setIncomingExpanded] = useState(false);
  
  // Copy feedback state
  const [copied, setCopied] = useState(false);
  
  // Countdown for share code expiration
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  
  // Transfer state (doctor only)
  const [patientEntityId, setPatientEntityId] = useState("");
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  
  const isDoctor = entityRole === "doctor";
  const isPatient = entityRole === "patient";
  
  // Update countdown timer for share code expiration
  useEffect(() => {
    if (!generatedShare) {
      setTimeRemaining("");
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = generatedShare.expiresAt - now;
      
      if (remaining <= 0) {
        setTimeRemaining("Expired");
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [generatedShare]);

  // Parse shareable items from properties (includes profile data for sharing, but not for transfer)
  const shareableItems = useMemo(() => {
    const result: Array<{ key: string; title: string; type: string; isProfile?: boolean }> = [];

    Object.entries(properties).forEach(([key, value]) => {
      // Include profile data for sharing (but mark it specially)
      if (key.startsWith(PropertyKeyPrefixes.PROFILE)) {
        try {
          const profileData = JSON.parse(value);
          const displayName = profileData.organizationName 
            ? `${profileData.title || ''} ${profileData.firstName || ''} ${profileData.lastName || ''} - ${profileData.organizationName}`.trim()
            : `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
          result.push({
            key,
            title: displayName || "Personal Information",
            type: "profile",
            isProfile: true,
          });
        } catch {
          result.push({
            key,
            title: "Personal Information",
            type: "profile",
            isProfile: true,
          });
        }
        return;
      }
      
      if (key.startsWith(PropertyKeyPrefixes.RECORD)) {
        const record = parseRecordFromProperty(value);
        if (record) {
          result.push({
            key,
            title: record.title,
            type: record.type,
          });
        }
      } else if (!key.startsWith(PropertyKeyPrefixes.PDF) && !key.startsWith(PropertyKeyPrefixes.PATIENTS)) {
        // Include simple properties too (but not PDF or patients list data)
        result.push({
          key,
          title: key,
          type: "other",
        });
      }
    });

    return result;
  }, [properties]);
  
  // Filter out profile data for transfers (ownership transfer shouldn't include master data)
  const transferableRecords = useMemo(() => {
    return shareableItems.filter(item => !item.isProfile);
  }, [shareableItems]);
  
  // All items are available for sharing (including profile data)
  const records = shareableItems;
  
  // Build a map of entity IDs to provider names from sharedData (for displaying who has access)
  const providerNames = useMemo(() => {
    const names: Record<string, { name: string; organization?: string }> = {};
    
    // Look through sharedData for profile information from providers
    sharedData.forEach((data) => {
      if (data.propertyName.startsWith(PropertyKeyPrefixes.PROFILE) && data.value) {
        try {
          const profile = JSON.parse(data.value);
          const name = profile.organizationName 
            ? `${profile.title || ''} ${profile.firstName || ''} ${profile.lastName || ''}`.trim()
            : `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
          
          if (name) {
            names[data.sourceEntityId] = {
              name: name || "Healthcare Provider",
              organization: profile.organizationName,
            };
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
    
    return names;
  }, [sharedData]);
  
  // Helper to get provider display name
  const getProviderDisplayName = (entityId: string) => {
    const provider = providerNames[entityId];
    if (provider) {
      return provider.organization 
        ? `${provider.name} (${provider.organization})`
        : provider.name;
    }
    return null;
  };

  // Handlers for sharing records (includes profile data)
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
  
  // Handlers for transfer records (excludes profile data)
  const handleTransferRecordToggle = (key: string) => {
    setSelectedTransferRecords((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleTransferSelectAll = () => {
    if (selectedTransferRecords.length === transferableRecords.length) {
      setSelectedTransferRecords([]);
    } else {
      setSelectedTransferRecords(transferableRecords.map((r) => r.key));
    }
  };

  const handleCreateShare = async () => {
    if (selectedRecords.length === 0) return;

    // Create shares for each selected record
    for (const key of selectedRecords) {
      await onCreateShare(key);
    }
  };
  
  const handleCopyCode = async () => {
    if (!generatedShare) return;
    
    try {
      await navigator.clipboard.writeText(generatedShare.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  const handleShareAnother = () => {
    setSelectedRecords([]);
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

  const handleTransfer = async () => {
    if (!onTransferRecords || selectedTransferRecords.length === 0 || !patientEntityId.trim()) return;
    
    try {
      await onTransferRecords(patientEntityId.trim(), selectedTransferRecords);
      setTransferSuccess(`Successfully transferred ${selectedTransferRecords.length} record(s) to patient`);
      setSelectedTransferRecords([]);
      setPatientEntityId("");
    } catch (err) {
      setTransferSuccess(null);
    }
  };

  // Calculate total active shares for badge
  const totalActiveShares = shares.outgoing.length + shares.incoming.length;

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Data Sharing</h2>
      </div>
      <p className="section-desc">
        Securely share encrypted medical records with healthcare providers.
        All data remains encrypted end-to-end.
      </p>

      {/* Tab Navigation */}
      <div className="share-tabs">
        <button
          className={`share-tab ${activeTab === "share" ? "active" : ""}`}
          onClick={() => setActiveTab("share")}
        >
          <ShareIcon style={{ width: "16px", height: "16px" }} />
          Share Records
        </button>
        <button
          className={`share-tab ${activeTab === "receive" ? "active" : ""}`}
          onClick={() => setActiveTab("receive")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          Receive Data
        </button>
        {isPatient && (
          <button
            className={`share-tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <HeartIcon style={{ width: "16px", height: "16px" }} />
            Requests
            {pendingRequestsCount > 0 && (
              <span className="tab-badge">{pendingRequestsCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Doctor: Transfer Records to Patient */}
      {isDoctor && activeTab === "share" && (
        <div className="subsection">
          <h3>Transfer Records to Patient</h3>
          <p className="subsection-desc">
            Transfer ownership of medical records to a patient. The patient will become the permanent owner
            and can share these records with other providers. You will retain read access.
          </p>

          {transferableRecords.length === 0 ? (
            <div
              style={{
                padding: "1.5rem",
                background: "var(--bg-tertiary)",
                borderRadius: "12px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No records to transfer. Upload medical documents first.
            </div>
          ) : (
            <>
              {/* Record Selection for Transfer */}
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
                    Select Records to Transfer ({selectedTransferRecords.length}/{transferableRecords.length})
                  </span>
                  <button className="small secondary" onClick={handleTransferSelectAll}>
                    {selectedTransferRecords.length === transferableRecords.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {transferableRecords.map((record) => (
                    <label
                      key={record.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: selectedTransferRecords.includes(record.key)
                          ? "var(--mint-pale)"
                          : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTransferRecords.includes(record.key)}
                        onChange={() => handleTransferRecordToggle(record.key)}
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

              {/* Patient Entity ID Input */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Patient Entity ID
                </label>
                <input
                  type="text"
                  placeholder="Enter the patient's entity ID (e.g., abc123-def456-...)"
                  value={patientEntityId}
                  onChange={(e) => setPatientEntityId(e.target.value)}
                  disabled={disabled || isTransferring}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={disabled || selectedTransferRecords.length === 0 || !patientEntityId.trim() || isTransferring}
                style={{ width: "100%", background: "var(--lavender)", color: "var(--lavender-dark)" }}
              >
                {isTransferring
                  ? "Transferring..."
                  : `Transfer ${selectedTransferRecords.length} Record${selectedTransferRecords.length !== 1 ? "s" : ""} to Patient`}
              </button>

              {/* Transfer Success */}
              {transferSuccess && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "var(--mint-pale)",
                    borderRadius: "12px",
                    border: "1px solid var(--mint-secondary)",
                  }}
                >
                  <p style={{ fontSize: "0.9rem", color: "var(--teal-deep)", fontWeight: 500 }}>
                    {transferSuccess}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    You now have read-only access to these records through the patient&apos;s vault.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Patient/General: Share Records */}
      {activeTab === "share" && (
        <div className="subsection">
          {/* Success State - Prominent Share Code Display */}
          {generatedShare ? (
            <div className="share-success-card">
              <div className="share-success-header">
                <div className="share-success-icon">
                  <CheckIcon style={{ width: "24px", height: "24px" }} />
                </div>
                <h3>Share Code Ready</h3>
                <p>Give this code to your healthcare provider</p>
              </div>
              
              <div className="share-code-display">
                <code>{generatedShare.code}</code>
                <button 
                  className={`copy-button ${copied ? "copied" : ""}`}
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <CheckIcon style={{ width: "16px", height: "16px" }} />
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              
              <div className="share-code-meta">
                <span className={`share-code-timer ${timeRemaining === "Expired" ? "expired" : ""}`}>
                  {timeRemaining === "Expired" ? "Code expired" : `Expires in ${timeRemaining}`}
                </span>
              </div>
              
              <button 
                className="secondary"
                onClick={handleShareAnother}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                Share Another Record
              </button>
            </div>
          ) : (
            <>
              <h3>{isPatient ? "Share Your Medical Records" : "Share Medical Records"}</h3>
              <p className="subsection-desc">
                {isPatient 
                  ? "Share your records with healthcare providers. You control who has access and can revoke at any time."
                  : "Select which records to share. Each share code is time-limited and can only be used once."}
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
                      {records.map((record) => {
                        const isProfile = record.isProfile;
                        return (
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
                                ? isProfile ? "rgba(124, 58, 237, 0.1)" : "var(--mint-pale)"
                                : "transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.key)}
                              onChange={() => handleRecordToggle(record.key)}
                              style={{ width: "18px", height: "18px", accentColor: isProfile ? "var(--lavender-dark)" : "var(--teal-deep)" }}
                            />
                            {isProfile ? (
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  background: "linear-gradient(135deg, var(--lavender) 0%, var(--lavender-secondary) 100%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.85rem",
                                }}
                              >
                                👤
                              </div>
                            ) : (
                              <div
                                className={`record-type-icon ${getRecordTypeIconClass(record.type as any)}`}
                                style={{ width: "32px", height: "32px", fontSize: "0.65rem" }}
                              >
                                {record.type.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500 }}>{record.title}</span>
                              {isProfile && (
                                <span style={{ fontSize: "0.75rem", color: "var(--lavender-dark)" }}>
                                  Personal Master Data
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={handleCreateShare}
                    disabled={disabled || selectedRecords.length === 0 || isCreating}
                    style={{ width: "100%" }}
                  >
                    {isCreating
                      ? "Generating Share Code..."
                      : `Generate Share Code${selectedRecords.length > 0 ? ` (${selectedRecords.length})` : ""}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Accept a Share */}
      {activeTab === "receive" && (
        <div className="subsection">
          <h3>Receive Shared Data</h3>
          <p className="subsection-desc">
            Enter a share code from a healthcare provider to receive their shared data.
          </p>
          <div className="receive-share-form">
            <input
              type="text"
              placeholder="Enter share code (e.g., 2MXL4D4JKQZS)"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              disabled={disabled}
              style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}
            />
            <button
              onClick={handleAcceptShare}
              disabled={disabled || !shareCode.trim() || isAccepting}
              style={{ width: "100%" }}
            >
              {isAccepting ? "Accepting..." : "Accept Share Code"}
            </button>
          </div>
        </div>
      )}

      {/* Data Requests Tab (Patient only) */}
      {activeTab === "requests" && isPatient && onFulfillRequest && onDeclineRequest && (
        <AccessRequestsPanel
          requests={dataRequests}
          myRecords={properties}
          onFulfill={onFulfillRequest}
          onDecline={onDeclineRequest}
          isFulfilling={isFulfillingRequest}
          isDeclining={isDecliningRequest}
        />
      )}

      {/* Incoming Shares - Collapsible */}
      {shares.incoming.length > 0 && (
        <div className="collapsible-section">
          <button 
            className="collapsible-header"
            onClick={() => setIncomingExpanded(!incomingExpanded)}
          >
            <div className="collapsible-title">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ 
                  transform: incomingExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease"
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>Data Shared With You</span>
            </div>
            <span className="collapsible-badge">{shares.incoming.length}</span>
          </button>
          
          {incomingExpanded && (
            <div className="collapsible-content">
              <ul className="share-list incoming">
            {shares.incoming.map((share) => {
              const data = sharedData.find(
                (s) => s.sourceEntityId === share.sourceEntityId && s.propertyName === share.propertyName
              );
              const isProfileShare = share.propertyName.startsWith(PropertyKeyPrefixes.PROFILE);
              const record = data?.value && !isProfileShare ? parseRecordFromProperty(data.value) : null;
              
              // Parse profile data if it's a profile share
              let profileInfo: { name?: string; org?: string } | null = null;
              if (isProfileShare && data?.value) {
                try {
                  const parsed = JSON.parse(data.value);
                  profileInfo = {
                    name: parsed.organizationName 
                      ? `${parsed.title || ''} ${parsed.firstName || ''} ${parsed.lastName || ''}`.trim()
                      : `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim(),
                    org: parsed.organizationName || undefined,
                  };
                } catch { /* ignore parse errors */ }
              }

              const sourceName = getProviderDisplayName(share.sourceEntityId);
              
              return (
                <li key={`${share.sourceEntityId}-${share.propertyName}`} className="share-item">
                  <div className="share-info">
                    <span className="share-source" title={`Entity ID: ${share.sourceEntityId}`}>
                      {sourceName ? (
                        <span style={{ fontWeight: 500 }}>{sourceName}</span>
                      ) : (
                        <CopyableEntityId entityId={share.sourceEntityId} short />
                      )}
                    </span>
                    <span className="share-property" style={isProfileShare ? { color: "var(--lavender-dark)" } : undefined}>
                      {isProfileShare ? (
                        <>
                          👤 {profileInfo?.name || "Personal Information"}
                          {profileInfo?.org && <span style={{ fontSize: "0.8em", opacity: 0.8 }}> ({profileInfo.org})</span>}
                        </>
                      ) : (
                        record?.title || share.propertyName
                      )}
                    </span>
                    <span className="share-value">
                      {isProfileShare 
                        ? "Master Data" 
                        : (record?.summary?.slice(0, 50) || data?.value?.slice(0, 50) || "(syncing...)") + 
                          ((record?.summary?.length || 0) > 50 ? "..." : "")
                      }
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
        </div>
      )}

      {/* Empty State */}
      {shares.outgoing.length === 0 && shares.incoming.length === 0 && (
        <div className="empty-state">
          <div style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }}>
            <ShareIcon style={{ width: "100%", height: "100%" }} />
          </div>
          <p>No active data shares</p>
          <span className="empty-hint">Share records with providers or receive shared data</span>
        </div>
      )}
    </div>
  );
}
