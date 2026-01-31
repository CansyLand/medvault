"use client";

import { useState, useMemo } from "react";
import { ListIcon, TimelineIcon, HeartIcon } from "./Icons";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentModal } from "./DocumentModal";
import { TimelineView } from "./TimelineView";
import { RecordTypeFilter, type FilterableRecordType } from "./RecordTypeFilter";
import { CopyableEntityId } from "./CopyableEntityId";
import type { MedicalRecord, MedicalRecordType } from "../types/medical";
import {
  parseRecordFromProperty,
  getRecordTypeIconClass,
  PropertyKeyPrefixes,
} from "../types/medical";
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
  disabled,
  className = "",
}: PatientRecordsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedTypes, setSelectedTypes] = useState<FilterableRecordType[]>(["all"]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedPdfBase64, setSelectedPdfBase64] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  // No patient selected state
  if (!patientId) {
    return (
      <div className={`patient-records-view no-patient ${className}`}>
        <div className="no-patient-message">
          <HeartIcon className="w-12 h-12" style={{ opacity: 0.2 }} />
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
      />
    </div>
  );
}
