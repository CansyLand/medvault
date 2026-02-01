"use client";

import React, { useState, useMemo, useEffect } from "react";
import { HistoryIcon, DocumentIcon, ShieldIcon, HeartIcon } from "./Icons";
import { getRecordTypeDisplayName, type MedicalRecord, type MedicalRecordType, parseRecordFromProperty, PropertyKeyPrefixes } from "../types/medical";
import type { DataRequest, PublicProfile } from "../lib/api";
import { getPublicProfiles } from "../lib/api";

// Type colors for visual distinction
const TYPE_COLORS: Record<MedicalRecordType, string> = {
  lab_report: "#3b82f6",
  imaging: "#a855f7",
  prescription: "#22c55e",
  clinical_notes: "#f59e0b",
  insurance: "#6366f1",
  immunization: "#14b8a6",
  allergy: "#ef4444",
  vital_signs: "#ec4899",
  document: "#64748b",
  other: "#94a3b8",
};

interface AccessRequestsPanelProps {
  requests: DataRequest[];
  myRecords: Record<string, string>; // properties from user's vault
  onFulfill: (requestId: string, sharedPropertyNames: string[]) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  isFulfilling?: boolean;
  isDeclining?: boolean;
}

interface ParsedRecord {
  key: string;
  record: MedicalRecord;
}

export function AccessRequestsPanel({
  requests,
  myRecords,
  onFulfill,
  onDecline,
  isFulfilling = false,
  isDeclining = false,
}: AccessRequestsPanelProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRecordKeys, setSelectedRecordKeys] = useState<Set<string>>(new Set());
  const [requesterProfiles, setRequesterProfiles] = useState<Record<string, PublicProfile>>({});

  // Get pending requests only
  const pendingRequests = useMemo(() => 
    requests.filter((r) => r.status === "pending"),
    [requests]
  );

  // Auto-select first request if none selected
  useEffect(() => {
    if (!selectedRequestId && pendingRequests.length > 0) {
      setSelectedRequestId(pendingRequests[0].id);
    }
  }, [pendingRequests, selectedRequestId]);

  // Fetch requester profiles
  useEffect(() => {
    const requesterIds = [...new Set(pendingRequests.map((r) => r.fromEntityId))];
    if (requesterIds.length === 0) return;

    getPublicProfiles(requesterIds)
      .then(setRequesterProfiles)
      .catch((err) => console.error("Failed to fetch requester profiles:", err));
  }, [pendingRequests]);

  const selectedRequest = useMemo(
    () => pendingRequests.find((r) => r.id === selectedRequestId) || null,
    [pendingRequests, selectedRequestId]
  );

  // Parse user's records
  const allMyRecords: ParsedRecord[] = useMemo(() => {
    const result: ParsedRecord[] = [];
    Object.entries(myRecords).forEach(([key, value]) => {
      if (key.startsWith(PropertyKeyPrefixes.RECORD)) {
        const record = parseRecordFromProperty(value);
        if (record) {
          result.push({ key, record });
        }
      }
    });
    return result.sort((a, b) => {
      const dateA = a.record.date || a.record.createdAt;
      const dateB = b.record.date || b.record.createdAt;
      return dateB.localeCompare(dateA);
    });
  }, [myRecords]);

  // Filter records by requested types
  const matchingRecords = useMemo(() => {
    if (!selectedRequest) return [];
    const requestedTypes = new Set(selectedRequest.requestedTypes);
    return allMyRecords.filter((r) => requestedTypes.has(r.record.type));
  }, [allMyRecords, selectedRequest]);

  // Reset selected records when request changes
  useEffect(() => {
    setSelectedRecordKeys(new Set());
  }, [selectedRequestId]);

  const handleToggleRecord = (key: string) => {
    setSelectedRecordKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRecordKeys.size === matchingRecords.length) {
      setSelectedRecordKeys(new Set());
    } else {
      setSelectedRecordKeys(new Set(matchingRecords.map((r) => r.key)));
    }
  };

  const handleFulfill = async () => {
    if (!selectedRequest || selectedRecordKeys.size === 0) return;
    await onFulfill(selectedRequest.id, Array.from(selectedRecordKeys));
    setSelectedRecordKeys(new Set());
    setSelectedRequestId(null);
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    await onDecline(selectedRequest.id);
    setSelectedRequestId(null);
  };

  const getRequesterName = (entityId: string) => {
    const profile = requesterProfiles[entityId];
    return profile?.displayName || `Provider ${entityId.slice(0, 8)}...`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // No pending requests
  if (pendingRequests.length === 0) {
    return (
      <div className="section">
        <div className="section-header">
          <h2 className="font-merriweather">Data Requests</h2>
        </div>
        <div className="empty-state">
          <div style={{ width: "48px", height: "48px", opacity: 0.3 }}>
            <HeartIcon style={{ width: "100%", height: "100%" }} />
          </div>
          <h3>No Pending Requests</h3>
          <p>When healthcare providers request your medical records, they will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Data Requests</h2>
        <span className="pending-badge">{pendingRequests.length} pending</span>
      </div>

      <div className="requests-layout">
        {/* Left Panel - Request List */}
        <div className="requests-list">
          {pendingRequests.map((request) => {
            const requesterName = getRequesterName(request.fromEntityId);
            const requesterProfile = requesterProfiles[request.fromEntityId];
            
            return (
              <button
                key={request.id}
                className={`request-item ${selectedRequestId === request.id ? "active" : ""}`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <div className="request-item-header">
                  <div className="request-requester">
                    <div className="request-avatar">
                      <ShieldIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4>{requesterName}</h4>
                      {requesterProfile?.organizationName && (
                        <span className="request-org">{requesterProfile.organizationName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="request-types-preview">
                  {request.requestedTypes.slice(0, 3).map((type) => (
                    <span
                      key={type}
                      className="type-chip-mini"
                      style={{ backgroundColor: `${TYPE_COLORS[type as MedicalRecordType]}20`, color: TYPE_COLORS[type as MedicalRecordType] }}
                    >
                      {getRecordTypeDisplayName(type as MedicalRecordType)}
                    </span>
                  ))}
                  {request.requestedTypes.length > 3 && (
                    <span className="type-chip-more">+{request.requestedTypes.length - 3}</span>
                  )}
                </div>
                <div className="request-meta">
                  <span className="request-time">{formatDate(request.createdAt)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Panel - Request Details */}
        {selectedRequest ? (
          <div className="request-details">
            {/* Header */}
            <div className="request-details-header">
              <div>
                <h3 className="font-merriweather">{getRequesterName(selectedRequest.fromEntityId)}</h3>
                {requesterProfiles[selectedRequest.fromEntityId]?.organizationName && (
                  <p className="request-org">{requesterProfiles[selectedRequest.fromEntityId]?.organizationName}</p>
                )}
              </div>
              <div className="request-status pending">
                <HistoryIcon className="w-4 h-4" />
                <span>Pending Decision</span>
              </div>
            </div>

            {/* Message */}
            {selectedRequest.message && (
              <div className="request-message">
                <p>"{selectedRequest.message}"</p>
              </div>
            )}

            {/* Requested Types */}
            <div className="request-types-section">
              <h4>Requested Data Types</h4>
              <div className="request-types-list">
                {selectedRequest.requestedTypes.map((type) => (
                  <span
                    key={type}
                    className="type-chip"
                    style={{ 
                      backgroundColor: `${TYPE_COLORS[type as MedicalRecordType]}15`, 
                      borderColor: TYPE_COLORS[type as MedicalRecordType],
                      color: TYPE_COLORS[type as MedicalRecordType] 
                    }}
                  >
                    <span 
                      className="type-dot" 
                      style={{ backgroundColor: TYPE_COLORS[type as MedicalRecordType] }}
                    />
                    {getRecordTypeDisplayName(type as MedicalRecordType)}
                  </span>
                ))}
              </div>
            </div>

            {/* Matching Records */}
            <div className="matching-records-section">
              <div className="matching-records-header">
                <h4>Your Matching Records ({matchingRecords.length})</h4>
                {matchingRecords.length > 0 && (
                  <button className="small secondary" onClick={handleSelectAll}>
                    {selectedRecordKeys.size === matchingRecords.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {matchingRecords.length === 0 ? (
                <div className="no-matching-records">
                  <p>No records match the requested types</p>
                  <span>You can still decline this request</span>
                </div>
              ) : (
                <div className="matching-records-list">
                  {matchingRecords.map((item) => {
                    const isSelected = selectedRecordKeys.has(item.key);
                    const typeColor = TYPE_COLORS[item.record.type];
                    const date = new Date(item.record.date || item.record.createdAt);
                    
                    return (
                      <button
                        key={item.key}
                        className={`matching-record-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleRecord(item.key)}
                      >
                        <div className="record-checkbox">
                          {isSelected && <span>✓</span>}
                        </div>
                        <div className="record-info">
                          <div className="record-title">{item.record.title}</div>
                          <div className="record-details">
                            <span 
                              className="record-type-badge"
                              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                            >
                              {getRecordTypeDisplayName(item.record.type)}
                            </span>
                            <span className="record-date">
                              {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {item.record.provider && (
                              <span className="record-provider">{item.record.provider}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="request-actions">
              <button
                className="secondary"
                onClick={handleDecline}
                disabled={isDeclining || isFulfilling}
              >
                {isDeclining ? "Declining..." : "Decline Request"}
              </button>
              <button
                className="primary"
                onClick={handleFulfill}
                disabled={selectedRecordKeys.size === 0 || isFulfilling || isDeclining}
              >
                {isFulfilling 
                  ? "Sharing..." 
                  : `Share ${selectedRecordKeys.size} Record${selectedRecordKeys.size !== 1 ? "s" : ""}`
                }
              </button>
            </div>

            {/* Encryption Notice */}
            <div className="encryption-notice">
              <DocumentIcon className="w-5 h-5" />
              <div>
                <h5>Your data remains encrypted</h5>
                <p>
                  Sharing records grants the requester access to view the specific records you've selected. 
                  You can revoke access at any time from the Sharing section.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="request-details empty">
            <div style={{ width: "48px", height: "48px" }}>
              <HistoryIcon style={{ width: "100%", height: "100%" }} />
            </div>
            <p>Select a request to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
