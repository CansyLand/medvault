"use client";

import { useState } from "react";
import type { MedicalRecordType } from "../types/medical";
import { getRecordTypeDisplayName } from "../types/medical";

interface RequestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestedTypes: MedicalRecordType[], message?: string) => Promise<void>;
  patientName: string;
  isSubmitting?: boolean;
}

// All available record types that can be requested
const REQUESTABLE_TYPES: MedicalRecordType[] = [
  "lab_report",
  "imaging",
  "prescription",
  "clinical_notes",
  "insurance",
  "immunization",
  "allergy",
  "vital_signs",
  "document",
  "other",
];

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

export function RequestDataModal({
  isOpen,
  onClose,
  onSubmit,
  patientName,
  isSubmitting = false,
}: RequestDataModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<MedicalRecordType[]>([]);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleToggleType = (type: MedicalRecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === REQUESTABLE_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([...REQUESTABLE_TYPES]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) return;
    await onSubmit(selectedTypes, message.trim() || undefined);
    // Reset form after successful submission
    setSelectedTypes([]);
    setMessage("");
    onClose();
  };

  const handleClose = () => {
    setSelectedTypes([]);
    setMessage("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content request-data-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Request Medical Data</h2>
          <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="request-description">
            Select the types of medical data you would like to request from <strong>{patientName}</strong>.
            They will receive a notification and can choose which records to share.
          </p>

          {/* Type Selection */}
          <div className="request-types-section">
            <div className="request-types-header">
              <h4>Data Types</h4>
              <button
                className="small secondary"
                onClick={handleSelectAll}
                type="button"
              >
                {selectedTypes.length === REQUESTABLE_TYPES.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="request-types-grid">
              {REQUESTABLE_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                const color = TYPE_COLORS[type];
                
                return (
                  <button
                    key={type}
                    type="button"
                    className={`request-type-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => handleToggleType(type)}
                    style={{
                      borderColor: isSelected ? color : undefined,
                      backgroundColor: isSelected ? `${color}15` : undefined,
                    }}
                  >
                    <span
                      className="request-type-dot"
                      style={{ backgroundColor: color }}
                    />
                    <span className="request-type-label">
                      {getRecordTypeDisplayName(type)}
                    </span>
                    {isSelected && (
                      <span className="request-type-check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Message */}
          <div className="request-message-section">
            <label htmlFor="request-message">Message (optional)</label>
            <textarea
              id="request-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain why you're requesting this data..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTypes.length === 0}
          >
            {isSubmitting ? "Sending..." : `Send Request (${selectedTypes.length} type${selectedTypes.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </div>
  );
}
