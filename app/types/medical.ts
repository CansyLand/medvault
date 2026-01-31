/**
 * MedVault Medical Data Types
 * 
 * These types map to TrueTrace's encrypted property system.
 * Each medical record is stored as an encrypted property with structured JSON value.
 */

// Record type classification
export type MedicalRecordType = 
  | "lab_report"
  | "imaging"
  | "prescription"
  | "clinical_notes"
  | "insurance"
  | "immunization"
  | "allergy"
  | "vital_signs"
  | "document"
  | "other";

// Base medical record structure (stored as JSON in property value)
export interface MedicalRecord {
  id: string;
  type: MedicalRecordType;
  title: string;
  date: string | null;
  provider: string | null;
  summary: string;
  content: string;
  structuredData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Uploaded document with PDF data
export interface UploadedDocument extends MedicalRecord {
  type: "document";
  fileName: string;
  mimeType: string;
  // Note: PDF data is stored separately due to size
  pdfPropertyKey: string; // Reference to the property storing base64 PDF
  extractedData: {
    language: string;
    type: string;
    structuredFields: Record<string, unknown>;
  };
}

// Lab report with test results
export interface LabReport extends MedicalRecord {
  type: "lab_report";
  structuredData: {
    testName: string;
    results: Array<{
      name: string;
      value: string;
      unit: string;
      referenceRange?: string;
      flag?: "normal" | "low" | "high" | "critical";
    }>;
    orderingPhysician?: string;
    specimenType?: string;
    collectionDate?: string;
  };
}

// Imaging record (MRI, X-ray, CT, etc.)
export interface ImagingRecord extends MedicalRecord {
  type: "imaging";
  structuredData: {
    imagingType: "MRI" | "CT" | "X-ray" | "Ultrasound" | "PET" | "Other";
    bodyPart: string;
    findings: string;
    impression: string;
    radiologist?: string;
  };
}

// Prescription/medication record
export interface Prescription extends MedicalRecord {
  type: "prescription";
  structuredData: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    prescriber: string;
    pharmacy?: string;
    refillsRemaining?: number;
    instructions?: string;
  };
}

// Requested data item with toggle state
export interface RequestedDataItem {
  id: string;
  name: string; // "Recent Blood Work", "X-Ray (Thorax)"
  source: "Documents" | "Profile";
  accessType: "Read Access" | "Write Access";
  enabled: boolean; // Toggle state
  documentId?: string; // Reference to document
  recordId?: string; // Reference to record
}

// Access request from healthcare provider
export interface DataAccessRequest {
  id: string;
  requester: string;
  requesterType: "doctor" | "hospital" | "insurance" | "researcher" | "other";
  purpose: string;
  requestedRecords: string[]; // Property keys (backwards compat)
  requestedItems?: RequestedDataItem[]; // Detailed items with toggles
  duration: string;
  status: "pending" | "approved" | "denied" | "expired" | "revoked";
  createdAt: string;
  expiresAt: string | null;
  respondedAt: string | null;
  format?: string; // "FHIR JSON"
  validity?: string; // "30 Days"
  retention?: string; // "Clinical Duration"
}

// Chat message for AI assistant
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Access grant (when you share data)
export interface AccessGrant {
  id: string;
  targetEntityId: string;
  targetName?: string;
  sharedRecords: string[]; // Property keys
  purpose: string;
  grantedAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "revoked";
}

// Type guards
export function isLabReport(record: MedicalRecord): record is LabReport {
  return record.type === "lab_report";
}

export function isImagingRecord(record: MedicalRecord): record is ImagingRecord {
  return record.type === "imaging";
}

export function isPrescription(record: MedicalRecord): record is Prescription {
  return record.type === "prescription";
}

export function isUploadedDocument(record: MedicalRecord): record is UploadedDocument {
  return record.type === "document";
}

// Helper to get display name for record type
export function getRecordTypeDisplayName(type: MedicalRecordType): string {
  const names: Record<MedicalRecordType, string> = {
    lab_report: "Lab Report",
    imaging: "Imaging",
    prescription: "Prescription",
    clinical_notes: "Clinical Notes",
    insurance: "Insurance",
    immunization: "Immunization",
    allergy: "Allergy",
    vital_signs: "Vital Signs",
    document: "Document",
    other: "Other",
  };
  return names[type] || "Unknown";
}

// Helper to get icon class for record type
export function getRecordTypeIconClass(type: MedicalRecordType): string {
  const classes: Record<MedicalRecordType, string> = {
    lab_report: "lab",
    imaging: "imaging",
    prescription: "rx",
    clinical_notes: "notes",
    insurance: "default",
    immunization: "rx",
    allergy: "notes",
    vital_signs: "lab",
    document: "default",
    other: "default",
  };
  return classes[type] || "default";
}

// Property key naming conventions
export const PropertyKeyPrefixes = {
  RECORD: "record:",      // Medical record data
  PDF: "pdf:",            // PDF binary data (base64)
  ACCESS: "access:",      // Access grant metadata
  META: "meta:",          // Metadata
} as const;

// Helper to create a property key for a medical record
export function createRecordPropertyKey(recordId: string): string {
  return `${PropertyKeyPrefixes.RECORD}${recordId}`;
}

// Helper to create a property key for PDF data
export function createPdfPropertyKey(documentId: string): string {
  return `${PropertyKeyPrefixes.PDF}${documentId}`;
}

// Helper to parse a medical record from property value
export function parseRecordFromProperty(value: string): MedicalRecord | null {
  try {
    return JSON.parse(value) as MedicalRecord;
  } catch {
    return null;
  }
}

// Helper to serialize a medical record for property storage
export function serializeRecordForProperty(record: MedicalRecord): string {
  return JSON.stringify(record);
}
