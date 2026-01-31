"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { DocumentIcon } from "./Icons";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentModal } from "./DocumentModal";
import {
  type MedicalRecord,
  parseRecordFromProperty,
  serializeRecordForProperty,
  getRecordTypeDisplayName,
  getRecordTypeIconClass,
  PropertyKeyPrefixes,
} from "../types/medical";

interface MedicalRecordsSectionProps {
  properties: Record<string, string>;
  onSetProperty: (key: string, value: string) => void;
  onDeleteProperty: (key: string) => void;
  onRenameRecord?: (key: string, oldName: string, newName: string) => void;
  disabled: boolean;
}

export function MedicalRecordsSection({
  properties,
  onSetProperty,
  onDeleteProperty,
  onRenameRecord,
  disabled,
}: MedicalRecordsSectionProps) {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedPdfBase64, setSelectedPdfBase64] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingKey && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingKey]);

  // Parse medical records from properties
  const records = useMemo(() => {
    const result: Array<{ key: string; record: MedicalRecord; pdfKey?: string }> = [];
    
    Object.entries(properties).forEach(([key, value]) => {
      if (key.startsWith(PropertyKeyPrefixes.RECORD)) {
        const record = parseRecordFromProperty(value);
        if (record) {
          // Check if there's a corresponding PDF
          const pdfKey = key.replace(PropertyKeyPrefixes.RECORD, PropertyKeyPrefixes.PDF);
          result.push({ 
            key, 
            record,
            pdfKey: properties[pdfKey] ? pdfKey : undefined,
          });
        }
      }
    });

    // Sort by date (newest first)
    return result.sort((a, b) => {
      const dateA = a.record.date || a.record.createdAt;
      const dateB = b.record.date || b.record.createdAt;
      return dateB.localeCompare(dateA);
    });
  }, [properties]);

  // Count non-record properties (simple key-value pairs)
  const simpleProperties = useMemo(() => {
    return Object.entries(properties).filter(
      ([key]) => !key.startsWith(PropertyKeyPrefixes.RECORD) && !key.startsWith(PropertyKeyPrefixes.PDF)
    );
  }, [properties]);

  const handleRecordClick = (record: MedicalRecord, pdfKey?: string) => {
    setSelectedRecord(record);
    setSelectedPdfBase64(pdfKey ? properties[pdfKey] : null);
    setShowModal(true);
  };

  const handleUpload = (
    recordKey: string,
    recordValue: string,
    pdfKey?: string,
    pdfValue?: string
  ) => {
    onSetProperty(recordKey, recordValue);
    if (pdfKey && pdfValue) {
      onSetProperty(pdfKey, pdfValue);
    }
  };

  const handleDelete = (key: string, pdfKey?: string) => {
    onDeleteProperty(key);
    if (pdfKey) {
      onDeleteProperty(pdfKey);
    }
  };

  const startRenaming = (key: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKey(key);
    setEditingName(currentName);
  };

  const cancelRenaming = () => {
    setEditingKey(null);
    setEditingName("");
  };

  const saveRename = (key: string, record: MedicalRecord) => {
    const newName = editingName.trim();
    if (!newName || newName === record.title) {
      cancelRenaming();
      return;
    }

    const oldName = record.title;
    const updatedRecord: MedicalRecord = {
      ...record,
      title: newName,
      updatedAt: new Date().toISOString(),
    };

    onSetProperty(key, serializeRecordForProperty(updatedRecord));
    
    if (onRenameRecord) {
      onRenameRecord(key, oldName, newName);
    }

    cancelRenaming();
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string, record: MedicalRecord) => {
    if (e.key === "Enter") {
      saveRename(key, record);
    } else if (e.key === "Escape") {
      cancelRenaming();
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="font-merriweather">Medical Records</h2>
        <span className="badge">{records.length}</span>
      </div>
      <p className="section-desc">
        Upload and manage encrypted medical documents. AI extracts key information automatically.
      </p>

      {/* Document Upload */}
      <DocumentUpload onUpload={handleUpload} disabled={disabled} />

      {/* Records List */}
      <div style={{ marginTop: "1.5rem" }}>
        {records.length === 0 ? (
          <div className="empty-state">
            <DocumentIcon style={{ width: '32px', height: '32px', opacity: 0.3, margin: "0 auto 1rem" }} />
            <p>No medical records yet</p>
            <span className="empty-hint">Upload a PDF to get started</span>
          </div>
        ) : (
          <ul className="property-list">
            {records.map(({ key, record, pdfKey }) => {
              const isEditing = editingKey === key;
              
              return (
                <li
                  key={key}
                  className="property-item"
                  onClick={() => !isEditing && handleRecordClick(record, pdfKey)}
                  style={{ cursor: isEditing ? "default" : "pointer" }}
                >
                  <div 
                    className={`record-type-icon ${getRecordTypeIconClass(record.type)}`}
                    style={{ width: '24px', height: '24px', fontSize: '0.6rem', borderRadius: '6px' }}
                  >
                    {getRecordTypeDisplayName(record.type).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="property-content">
                    {isEditing ? (
                      <div className="rename-form" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, key, record)}
                          onBlur={() => saveRename(key, record)}
                          className="rename-input"
                          placeholder="Enter new name..."
                        />
                      </div>
                    ) : (
                      <>
                        <span className="property-key">{record.title}</span>
                        <span className="property-value">
                          {record.summary?.slice(0, 100)}
                          {record.summary && record.summary.length > 100 ? "..." : ""}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {record.date || "No date"} • {record.provider || "Unknown provider"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="property-actions">
                    {!isEditing && (
                      <button
                        className="small secondary"
                        onClick={(e) => startRenaming(key, record.title, e)}
                        disabled={disabled}
                        title="Rename"
                      >
                        Rename
                      </button>
                    )}
                    <button
                      className="small danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(key, pdfKey);
                      }}
                      disabled={disabled || isEditing}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Simple Properties Section */}
      {simpleProperties.length > 0 && (
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Other Data ({simpleProperties.length})
          </h3>
          <ul className="property-list">
            {simpleProperties.map(([key, value]) => (
              <li key={key} className="property-item">
                <div 
                  className="record-type-icon default"
                  style={{ width: '24px', height: '24px' }}
                >
                  <DocumentIcon style={{ width: '12px', height: '12px' }} />
                </div>
                <div className="property-content">
                  <span className="property-key">{key}</span>
                  <span className="property-value">{value || <em className="empty">empty</em>}</span>
                </div>
                <button
                  className="small danger"
                  onClick={() => onDeleteProperty(key)}
                  disabled={disabled}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document Modal */}
      <DocumentModal
        record={selectedRecord}
        pdfBase64={selectedPdfBase64}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRecord(null);
          setSelectedPdfBase64(null);
        }}
      />
    </div>
  );
}
