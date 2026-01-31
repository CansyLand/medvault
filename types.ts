export interface DataRequest {
	id: string
	requester: string
	purpose: string
	fields: string[]
	duration: string
	status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked'
	timestamp: string
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
