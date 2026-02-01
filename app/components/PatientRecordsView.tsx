"use client";

import { useState, useMemo } from "react";
import { ListIcon, TimelineIcon, HeartIcon } from "./Icons";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentModal } from "./DocumentModal";
import { TimelineView } from "./TimelineView";
import { RecordTypeFilter, type FilterableRecordType } from "./RecordTypeFilter";
import { CopyableEntityId } from "./CopyableEntityId";
import { RequestDataModal } from "./RequestDataModal";
import type { MedicalRecord, MedicalRecordType } from "../types/medical";
import {
  parseRecordFromProperty,
  serializeRecordForProperty,
  getRecordTypeIconClass,
  PropertyKeyPrefixes,
  createRecordPropertyKey,
  createPdfPropertyKey,
} from "../types/medical";
import { extractPDFContent } from "../services/geminiService";
import { getTypeConfig } from "./RecordTypeFilter";

interface PatientRecordsViewProps {
  patientId: string | null;
  patientName: string;
  // Records shared with the doctor (from patient)
  sharedRecords: Array<{ propertyName: string; value: string }>;
  // Records the doctor has uploaded (pending transfer)
  pendingRecords: Record<string, string>;
  onUpload: (recordKey: string, recordValue: string, pdfKey?: string, pdfValue?: string) => void;
  onDeleteRecord: (key: string, pdfKey?: string) => void;
  onRequestData?: (patientId: string, requestedTypes: MedicalRecordType[], message?: string) => Promise<void>;
  isRequestingData?: boolean;
  disabled: boolean;
  className?: string;
}

type ViewMode = "timeline" | "table";

interface ParsedRecord {
  key: string;
  record: MedicalRecord;
  pdfKey?: string;
  source: "shared" | "pending";
}

export function PatientRecordsView({
  patientId,
  patientName,
  sharedRecords,
  pendingRecords,
  onUpload,
  onDeleteRecord,
  onRequestData,
  isRequestingData = false,
  disabled,
  className = "",
}: PatientRecordsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedTypes, setSelectedTypes] = useState<FilterableRecordType[]>(["all"]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedPdfBase64, setSelectedPdfBase64] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Parse all records
  const allRecords = useMemo(() => {
    const result: ParsedRecord[] = [];

    // Parse shared records (from patient)
    sharedRecords.forEach(({ propertyName, value }) => {
      const record = parseRecordFromProperty(value);
      if (record) {
        result.push({
          key: propertyName,
          record,
          source: "shared",
        });
      }
    });

    // Parse pending records (uploaded by doctor, not yet transferred)
    Object.entries(pendingRecords).forEach(([key, value]) => {
      if (key.startsWith(PropertyKeyPrefixes.RECORD)) {
        const record = parseRecordFromProperty(value);
        if (record) {
          const pdfKey = key.replace(PropertyKeyPrefixes.RECORD, PropertyKeyPrefixes.PDF);
          result.push({
            key,
            record,
            pdfKey: pendingRecords[pdfKey] ? pdfKey : undefined,
            source: "pending",
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
  }, [sharedRecords, pendingRecords]);

  // Calculate record counts by type
  const recordCounts = useMemo(() => {
    const counts: Record<MedicalRecordType, number> = {} as Record<MedicalRecordType, number>;
    allRecords.forEach(({ record }) => {
      counts[record.type] = (counts[record.type] || 0) + 1;
    });
    return counts;
  }, [allRecords]);

  // Filter records by selected types
  const filteredRecords = useMemo(() => {
    if (selectedTypes.includes("all") || selectedTypes.length === 0) {
      return allRecords;
    }
    return allRecords.filter(({ record }) => 
      selectedTypes.includes(record.type as FilterableRecordType)
    );
  }, [allRecords, selectedTypes]);

  const handleToggleType = (type: FilterableRecordType) => {
    if (type === "all") {
      setSelectedTypes(["all"]);
    } else {
      setSelectedTypes((prev) => {
        const withoutAll = prev.filter((t) => t !== "all");
        if (withoutAll.includes(type)) {
          const newTypes = withoutAll.filter((t) => t !== type);
          return newTypes.length === 0 ? ["all"] : newTypes;
        }
        return [...withoutAll, type];
      });
    }
  };

  const handleRecordClick = (record: MedicalRecord, pdfKey?: string) => {
    setSelectedRecord(record);
    setSelectedPdfBase64(pdfKey ? pendingRecords[pdfKey] : null);
    setShowModal(true);
  };

  // Retry document extraction
  const handleRetryExtraction = async (recordId: string, pdfBase64: string) => {
    setIsRetrying(true);
    try {
      const extractedData = await extractPDFContent(pdfBase64);
      
      // Check if extraction still failed
      if (extractedData.title === "Extraction Failed") {
        alert(`Extraction failed: ${extractedData.content}\n\nPlease try again later.`);
        return;
      }

      const recordKey = createRecordPropertyKey(recordId);
      const now = new Date().toISOString();

      // Map extracted type to our type system
      const typeMap: Record<string, MedicalRecordType> = {
        "Lab Report": "lab_report",
        "Prescription": "prescription",
        "Imaging": "imaging",
        "Clinical Notes": "clinical_notes",
        "Insurance": "insurance",
        "Other": "document",
      };

      const recordType = typeMap[extractedData.type] || "document";

      // Get existing record to preserve some metadata
      const existingRecord = selectedRecord;
      
      // Create updated record
      const updatedRecord: MedicalRecord = {
        id: recordId,
        type: recordType,
        title: extractedData.title || "Document",
        date: extractedData.date,
        provider: extractedData.provider,
        summary: extractedData.summary,
        content: extractedData.content,
        structuredData: extractedData.structuredFields || {},
        createdAt: existingRecord?.createdAt || now,
        updatedAt: now,
        sourceFileName: existingRecord?.sourceFileName,
        uploadMethod: existingRecord?.uploadMethod || "manual_upload",
        uploadedBy: existingRecord?.uploadedBy,
        uploaderName: existingRecord?.uploaderName,
        processingDetails: {
          aiModel: "gemini-2.0-flash",
          extractedAt: now,
          originalType: extractedData.type,
        },
        modificationHistory: [
          ...(existingRecord?.modificationHistory || []),
          {
            action: "reprocessed",
            timestamp: now,
          },
        ],
      };

      // Update the record in pending records
      onUpload(recordKey, serializeRecordForProperty(updatedRecord));
      
      // Update selected record in modal
      setSelectedRecord(updatedRecord);
      
      // Show success message
      alert("Document successfully reprocessed!");
    } catch (error) {
      console.error("Retry extraction failed:", error);
      alert("Failed to reprocess document. Please try again later.");
    } finally {
      setIsRetrying(false);
    }
  };

  // No patient selected state
  if (!patientId) {
    return (
      <div className={`patient-records-view no-patient ${className}`}>
        <div className="no-patient-message">
          <div style={{ width: "48px", height: "48px", opacity: 0.2 }}>
            <HeartIcon style={{ width: "100%", height: "100%" }} />
          </div>
          <h3>Select a Patient</h3>
          <p>Choose a patient from the list to view their medical records</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`patient-records-view ${className}`}>
      {/* Patient Header */}
      <div className="patient-header">
        <div className="patient-header-info">
          <h2>{patientName}</h2>
          <CopyableEntityId entityId={patientId} short />
        </div>
        <div className="patient-header-actions">
          {onRequestData && (
            <button
              className="request-data-btn"
              onClick={() => setShowRequestModal(true)}
              disabled={disabled}
            >
              Request Data
            </button>
          )}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "timeline" ? "active" : ""}`}
              onClick={() => setViewMode("timeline")}
              title="Timeline View"
            >
              <TimelineIcon className="w-4 h-4" />
              <span>Timeline</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <RecordTypeFilter
        recordCounts={recordCounts}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
      />

      {/* Upload Area for this Patient */}
      <div className="patient-upload-section">
        <p className="upload-label">Add records for {patientName}</p>
        <DocumentUpload onUpload={onUpload} disabled={disabled} compact />
      </div>

      {/* Records Display */}
      <div className="patient-records-content">
        {filteredRecords.length === 0 ? (
          <div className="records-empty">
            <p>No records found</p>
            <span>Upload a document or adjust your filters</span>
          </div>
        ) : viewMode === "timeline" ? (
          <TimelineView
            records={filteredRecords.map((r) => ({
              key: r.key,
              record: r.record,
              pdfKey: r.pdfKey,
            }))}
            onRecordClick={handleRecordClick}
          />
        ) : (
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Provider</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => {
                  const typeConfig = getTypeConfig(item.record.type);
                  const date = new Date(item.record.date || item.record.createdAt);
                  
                  return (
                    <tr 
                      key={item.key}
                      onClick={() => handleRecordClick(item.record, item.pdfKey)}
                      className="clickable"
                    >
                      <td>
                        <div 
                          className={`record-type-icon ${getRecordTypeIconClass(item.record.type)}`}
                          style={{ width: "24px", height: "24px", fontSize: "0.55rem" }}
                        >
                          {typeConfig.label.slice(0, 2).toUpperCase()}
                        </div>
                      </td>
                      <td className="record-title">{item.record.title}</td>
                      <td className="record-date">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="record-provider">{item.record.provider || "—"}</td>
                      <td>
                        <span className={`source-badge ${item.source}`}>
                          {item.source === "shared" ? "From Patient" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {item.source === "pending" && (
                          <button
                            className="small danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRecord(item.key, item.pdfKey);
                            }}
                            disabled={disabled}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        onRetry={handleRetryExtraction}
        isRetrying={isRetrying}
      />

      {/* Request Data Modal */}
      {onRequestData && (
        <RequestDataModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSubmit={async (requestedTypes, message) => {
            await onRequestData(patientId!, requestedTypes, message);
          }}
          patientName={patientName}
          isSubmitting={isRequestingData}
        />
      )}
    </div>
  );
}
