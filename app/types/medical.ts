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
  PROFILE: "profile:",    // User profile data
  PATIENTS: "patients:",  // Registered patients list (for doctors)
} as const;

// =====================
// User Profile Types
// =====================

// Address structure used by both patient and provider
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Patient profile - comprehensive health vault owner data
export interface PatientProfile {
  // Basic Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  
  // Contact
  email: string;
  phone: string;
  address: Address;
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Medical Info
  bloodType: string;
  allergies: string[];
  primaryPhysician: string;
  
  // Insurance
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  
  // Metadata
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Organization types for healthcare providers
export type OrganizationType = "hospital" | "clinic" | "private_practice" | "laboratory" | "pharmacy" | "other";

// Provider profile - healthcare organization/professional data
export interface ProviderProfile {
  // Basic Info
  firstName: string;
  lastName: string;
  title: string; // Dr., NP, PA, etc.
  
  // Organization
  organizationName: string;
  organizationType: OrganizationType;
  specialty: string;
  
  // Credentials
  licenseNumber: string;
  npiNumber: string;
  accreditations: string[];
  
  // Contact
  email: string;
  phone: string;
  facilityAddress: Address;
  
  // Metadata
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Union type for any user profile
export type UserProfile = PatientProfile | ProviderProfile;

// Public profile - non-sensitive display info for graph labels
export interface PublicProfile {
  entityId: string;
  displayName: string;
  role: "patient" | "doctor";
  subtitle?: string; // Specialty for doctors, empty for patients
  organizationName?: string;
}

// Type guard for patient profile
export function isPatientProfile(profile: UserProfile): profile is PatientProfile {
  return "emergencyContact" in profile && "insurance" in profile;
}

// Type guard for provider profile
export function isProviderProfile(profile: UserProfile): profile is ProviderProfile {
  return "organizationName" in profile && "npiNumber" in profile;
}

// Helper to get display name from profile
export function getDisplayName(profile: UserProfile): string {
  if (isProviderProfile(profile)) {
    return `${profile.title} ${profile.firstName} ${profile.lastName}`.trim();
  }
  return `${profile.firstName} ${profile.lastName}`.trim();
}

// Helper to create default patient profile
export function createDefaultPatientProfile(): PatientProfile {
  const now = new Date().toISOString();
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "prefer_not_to_say",
    email: "",
    phone: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    emergencyContact: { name: "", relationship: "", phone: "" },
    bloodType: "",
    allergies: [],
    primaryPhysician: "",
    insurance: { provider: "", policyNumber: "", groupNumber: "" },
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Helper to create default provider profile
export function createDefaultProviderProfile(): ProviderProfile {
  const now = new Date().toISOString();
  return {
    firstName: "",
    lastName: "",
    title: "",
    organizationName: "",
    organizationType: "private_practice",
    specialty: "",
    licenseNumber: "",
    npiNumber: "",
    accreditations: [],
    email: "",
    phone: "",
    facilityAddress: { street: "", city: "", state: "", zipCode: "", country: "" },
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}

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
