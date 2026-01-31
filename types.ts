export interface RequestedDataItem {
	id: string
	name: string // "Recent Blood Work", "X-Ray (Thorax)"
	source: 'Documents' | 'Profile'
	accessType: 'Read Access' | 'Write Access'
	enabled: boolean // Toggle state
	documentId?: string // Reference to UploadedDocument if from docs
	recordId?: string // Reference to MedicalRecord if from mock
}

export interface DataRequest {
	id: string
	requester: string
	purpose: string
	fields: string[] // Keep for backwards compatibility
	requestedItems: RequestedDataItem[] // NEW: detailed items with toggles
	duration: string
	status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked'
	timestamp: string
	format?: string // "FHIR JSON"
	validity?: string // "30 Days"
	retention?: string // "Clinical Duration"
}

export interface MedicalRecord {
	id: string
	type: string
	title: string
	date: string
	source: string
}

export enum AppView {
	LANDING = 'landing',
	DEMO = 'demo',
}

export interface AccessNode {
	id: string
	name: string
	type: 'patient' | 'doctor' | 'hospital' | 'researcher'
}

export interface AccessEdge {
	id: string
	source: string
	target: string
	sharedDataTypes: string[]
	status: 'active' | 'pending' | 'revoked'
}

export interface UploadedDocument {
	id: string
	fileName: string
	uploadDate: string
	pdfBase64: string // For displaying original PDF
	extractedData: {
		type: string // e.g., "Lab Report", "Prescription", "Imaging"
		language: string // e.g., "English", "German"
		title: string
		date: string | null
		provider: string | null
		content: string // Full extracted text
		summary: string // AI-generated summary
		structuredFields: Record<string, any> // Key medical data points
	}
}

export interface PageContent {
	title: string
	url: string
	text: string
	timestamp: Date
}

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: Date
}
