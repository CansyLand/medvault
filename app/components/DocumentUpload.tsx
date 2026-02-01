"use client";

import { useState, useRef } from "react";
import { UploadIcon, DocumentIcon } from "./Icons";
import { extractPDFContent, type ExtractedDocumentData } from "../services/geminiService";
import { 
  type MedicalRecord, 
  type MedicalRecordType,
  createRecordPropertyKey,
  createPdfPropertyKey,
  serializeRecordForProperty,
} from "../types/medical";

interface DocumentUploadProps {
  onUpload: (recordKey: string, recordValue: string, pdfKey?: string, pdfValue?: string) => void;
  disabled: boolean;
  compact?: boolean;
  // For data lineage - who is uploading
  uploadedBy?: string;
  uploaderName?: string;
}

export function DocumentUpload({ onUpload, disabled, compact = false, uploadedBy, uploaderName }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.includes("pdf")) {
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result.split(",")[1]); // Remove data:application/pdf;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract content using Gemini AI
      const extractedData = await extractPDFContent(base64);

      // Create record ID
      const recordId = `doc-${Date.now()}`;
      const recordKey = createRecordPropertyKey(recordId);
      const pdfKey = createPdfPropertyKey(recordId);

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
      const now = new Date().toISOString();

      // Create medical record with data lineage
      const record: MedicalRecord = {
        id: recordId,
        type: recordType,
        title: extractedData.title || file.name,
        date: extractedData.date,
        provider: extractedData.provider,
        summary: extractedData.summary,
        content: extractedData.content,
        structuredData: extractedData.structuredFields || {},
        createdAt: now,
        updatedAt: now,
        // Data Lineage
        sourceFileName: file.name,
        uploadMethod: "manual_upload",
        uploadedBy: uploadedBy,
        uploaderName: uploaderName,
        processingDetails: {
          aiModel: "gemini-2.0-flash",
          extractedAt: now,
          originalType: extractedData.type,
        },
        modificationHistory: [{
          action: "created",
          timestamp: now,
        }],
      };

      // Store both the record metadata and PDF data
      onUpload(
        recordKey,
        serializeRecordForProperty(record),
        pdfKey,
        base64
      );

    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input so the same file can be uploaded again
    event.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div
      style={{
        padding: compact ? "1rem" : "2rem",
        border: `2px dashed ${dragOver ? "var(--teal-deep)" : "var(--border)"}`,
        borderRadius: compact ? "12px" : "16px",
        background: dragOver ? "var(--mint-pale)" : "var(--bg-tertiary)",
        textAlign: "center",
        cursor: disabled || uploading ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={disabled || uploading}
      />

      {uploading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? "0.75rem" : "1rem", flexDirection: compact ? "row" : "column" }}>
          <div
            style={{
              width: compact ? "24px" : "48px",
              height: compact ? "24px" : "48px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--teal-deep)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: compact ? "0.9rem" : "1rem" }}>
              {compact ? "Processing..." : "Processing document with AI..."}
            </p>
            {!compact && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Extracting and encrypting medical data
              </p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: compact ? "0.75rem" : "1rem", flexDirection: compact ? "row" : "column" }}>
          <UploadIcon
            style={{ 
              width: compact ? "24px" : "48px", 
              height: compact ? "24px" : "48px", 
              color: "var(--teal-deep)", 
              opacity: 0.6,
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: compact ? "0.9rem" : "1rem" }}>
              {compact ? "Drop PDF or click to upload" : "Drop a PDF here or click to upload"}
            </p>
            {!compact && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Documents are analyzed by AI and encrypted before storage
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
