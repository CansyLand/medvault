"use client";

import React, { useState, useEffect } from "react";
import {
  DataAccessRequest,
  RequestedDataItem,
} from "../types/medical";
import { AlertTriangleIcon, HistoryIcon, DocumentIcon } from "./Icons";

interface AccessRequestsPanelProps {
  requests: DataAccessRequest[];
  onApproveSelected: (
    requestId: string,
    selectedItems: RequestedDataItem[]
  ) => void;
  onApproveAll: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

// Helper to get icon based on item type
const getItemIcon = (name: string, source: string) => {
  const nameLower = name.toLowerCase();
  if (
    nameLower.includes("blood") ||
    nameLower.includes("lab") ||
    nameLower.includes("panel")
  ) {
    return (
      <div className="record-type-icon lab" style={{ width: "40px", height: "40px" }}>
        LA
      </div>
    );
  }
  if (nameLower.includes("allergy") || nameLower.includes("alert")) {
    return (
      <AlertTriangleIcon className="w-5 h-5" style={{ color: "var(--warning)" }} />
    );
  }
  if (
    nameLower.includes("medication") ||
    nameLower.includes("rx") ||
    nameLower.includes("prescription")
  ) {
    return (
      <div className="record-type-icon rx" style={{ width: "40px", height: "40px" }}>
        RX
      </div>
    );
  }
  if (
    nameLower.includes("x-ray") ||
    nameLower.includes("mri") ||
    nameLower.includes("imaging") ||
    nameLower.includes("scan")
  ) {
    return (
      <div className="record-type-icon imaging" style={{ width: "40px", height: "40px" }}>
        IM
      </div>
    );
  }
  return <DocumentIcon className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />;
};

export function AccessRequestsPanel({
  requests,
  onApproveSelected,
  onApproveAll,
  onDeny,
}: AccessRequestsPanelProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    requests.length > 0 ? requests[0].id : null
  );
  const [itemToggles, setItemToggles] = useState<Record<string, boolean>>({});

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;

  // Initialize toggles when selected request changes
  useEffect(() => {
    if (selectedRequest && selectedRequest.requestedItems) {
      const initialToggles: Record<string, boolean> = {};
      selectedRequest.requestedItems.forEach((item) => {
        initialToggles[item.id] = item.enabled;
      });
      setItemToggles(initialToggles);
    }
  }, [selectedRequest]);

  const handleToggle = (itemId: string) => {
    setItemToggles((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleApproveSelected = () => {
    if (!selectedRequest || !selectedRequest.requestedItems) return;
    const selectedItems = selectedRequest.requestedItems.filter(
      (item) => itemToggles[item.id]
    );
    onApproveSelected(selectedRequest.id, selectedItems);
  };

  const handleApproveAll = () => {
    if (!selectedRequest) return;
    onApproveAll(selectedRequest.id);
  };

  const handleDeny = () => {
    if (!selectedRequest) return;
    onDeny(selectedRequest.id);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const selectedItemCount = selectedRequest?.requestedItems
    ? Object.values(itemToggles).filter(Boolean).length
    : 0;

  return (
    <div style={{ display: "flex", gap: "1.5rem", minHeight: "500px" }}>
      {/* Left Panel - Request List */}
      <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {pendingRequests.map((request) => (
          <button
            key={request.id}
            onClick={() => setSelectedRequestId(request.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "1rem",
              borderRadius: "16px",
              border: selectedRequestId === request.id
                ? "2px solid var(--teal-deep)"
                : "2px solid var(--border)",
              background: selectedRequestId === request.id
                ? "var(--mint-pale)"
                : "white",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <h4 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
              {request.requester}
            </h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {request.purpose}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                background: "var(--bg-tertiary)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}>
                {request.requestedItems?.length || 0} ITEMS
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {request.createdAt}
              </span>
            </div>
          </button>
        ))}

        {pendingRequests.length === 0 && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "0.875rem" }}>No pending requests</p>
          </div>
        )}
      </div>

      {/* Right Panel - Request Details */}
      {selectedRequest && selectedRequest.status === "pending" ? (
        <div style={{
          flex: 1,
          background: "white",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          padding: "1.5rem",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: '"Merriweather", Georgia, serif' }}>
                {selectedRequest.requester}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                {selectedRequest.purpose}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.75rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "9999px",
            }}>
              <HistoryIcon className="w-4 h-4" style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--warning)" }}>
                Pending Decision
              </span>
            </div>
          </div>

          {/* Data Items */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Data requested from your vault
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {selectedRequest.requestedItems?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    background: "var(--bg-tertiary)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "white",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border)",
                    }}>
                      {getItemIcon(item.name, item.source)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Source: {item.source} • {item.accessType}
                      </div>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "28px",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: "pointer",
                      background: itemToggles[item.id] ? "var(--teal-deep)" : "var(--border-light)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: itemToggles[item.id] ? "24px" : "4px",
                        width: "20px",
                        height: "20px",
                        background: "white",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "left 0.15s ease",
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "var(--bg-tertiary)",
            borderRadius: "12px",
          }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Format
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                FHIR JSON
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Validity
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {selectedRequest.expiresAt ? "Until " + selectedRequest.expiresAt : "30 Days"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Retention
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Clinical Duration
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              onClick={handleDeny}
              className="secondary"
              style={{ padding: "0.75rem 1.5rem" }}
            >
              Deny Request
            </button>
            <button
              onClick={handleApproveSelected}
              disabled={selectedItemCount === 0}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                border: "2px solid var(--teal-deep)",
                color: "var(--teal-deep)",
              }}
            >
              Approve Selected
            </button>
            <button
              onClick={handleApproveAll}
              style={{ padding: "0.75rem 1.5rem" }}
            >
              Approve All
            </button>
          </div>

          {/* Encryption Notice */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "var(--mint-pale)",
            borderRadius: "12px",
            border: "1px solid var(--mint-secondary)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <DocumentIcon className="w-5 h-5" style={{ color: "var(--teal-deep)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h5 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  Your data remains encrypted
                </h5>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                  Approving a request grants a timed, verifiable cryptographic key to view the specific fields you've allowed. You can revoke access at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          background: "white",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <HistoryIcon className="w-12 h-12" style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Select a request to review</p>
          </div>
        </div>
      )}
    </div>
  );
}
