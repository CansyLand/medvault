import React, { useState, useEffect, useRef } from 'react'
import {
	DataRequest,
	MedicalRecord,
	UploadedDocument,
	RequestedDataItem,
} from '../types'
import {
	analyzeHealthInsight,
	extractPDFContent,
	testGeminiConnection,
} from '../services/geminiService'
import { sendApprovalWebhook } from '../services/webhookService'
import { ShieldIcon, UploadIcon } from './Icons'
import { AccessNetworkFlow } from './AccessNetworkFlow'
import { EdgeConfigModal } from './EdgeConfigModal'
import { DocumentModal } from './DocumentModal'
import { ChatAssistant } from './ChatAssistant'
import { AccessRequestsPanel } from './AccessRequestsPanel'
import { Edge } from '@xyflow/react'

const MOCK_RECORDS: MedicalRecord[] = [
	{
		id: '1',
		type: 'Imaging',
		title: 'Chest MRI',
		date: '2024-01-15',
		source: 'Berlin Central Clinic',
	},
	{
		id: '2',
		type: 'Lab',
		title: 'Full Blood Panel',
		date: '2023-11-20',
		source: 'LabCorp',
	},
	{
		id: '3',
		type: 'Rx',
		title: 'Current Medications',
		date: '2024-02-10',
		source: 'Personal Vault',
	},
]

const INITIAL_REQUESTS: DataRequest[] = [
	{
		id: 'req-1',
		requester: 'Stanford Medical Center',
		purpose: 'Oncology Consultation Pre-screening',
		fields: ['MRI.scan', 'Medications.current', 'Allergies', 'Blood Work'],
		requestedItems: [
			{
				id: 'item-1',
				name: 'Recent Blood Work',
				source: 'Documents',
				accessType: 'Read Access',
				enabled: true,
				recordId: '2',
			},
			{
				id: 'item-2',
				name: 'Allergy List',
				source: 'Profile',
				accessType: 'Read Access',
				enabled: true,
			},
			{
				id: 'item-3',
				name: 'Medication History',
				source: 'Profile',
				accessType: 'Read Access',
				enabled: true,
			},
			{
				id: 'item-4',
				name: 'X-Ray (Thorax)',
				source: 'Documents',
				accessType: 'Read Access',
				enabled: true,
				recordId: '1',
			},
		],
		duration: '30 days',
		status: 'pending',
		timestamp: '2023-10-24',
		format: 'FHIR JSON',
		validity: '30 Days',
		retention: 'Clinical Duration',
	},
	{
		id: 'req-2',
		requester: 'MediLife Insurance',
		purpose: 'Policy Renewal Risk Assessment',
		fields: ['Lab Results', 'Imaging'],
		requestedItems: [
			{
				id: 'item-5',
				name: 'Full Blood Panel',
				source: 'Documents',
				accessType: 'Read Access',
				enabled: true,
				recordId: '2',
			},
			{
				id: 'item-6',
				name: 'Chest MRI',
				source: 'Documents',
				accessType: 'Read Access',
				enabled: true,
				recordId: '1',
			},
		],
		duration: '14 days',
		status: 'pending',
		timestamp: '2023-10-23',
		format: 'FHIR JSON',
		validity: '14 Days',
		retention: 'Policy Duration',
	},
]

export const DemoView: React.FC = () => {
	const [requests, setRequests] = useState<DataRequest[]>(INITIAL_REQUESTS)
	const [insight, setInsight] = useState<string>(
		'Welcome to your vault. Your data is encrypted.',
	)
	const [activeTab, setActiveTab] = useState<'history' | 'network'>('history')
	const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
	const [showEdgeModal, setShowEdgeModal] = useState(false)
	const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
	const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null)
	const [showDocModal, setShowDocModal] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [processingFileName, setProcessingFileName] = useState<string | null>(
		null,
	)
	const [approvingRequests, setApprovingRequests] = useState<Set<string>>(new Set())
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const fetchInsight = async () => {
			const res = await analyzeHealthInsight(MOCK_RECORDS)
			setInsight(res || '')
		}
		fetchInsight()
	}, [])

	const handleEdgeClick = (edge: Edge) => {
		setSelectedEdge(edge)
		setShowEdgeModal(true)
	}

	const handleEdgeSave = (edgeId: string, sharedDataTypes: string[]) => {
		// In a real app, this would update the edge data in the flow state
		console.log('Saving edge config:', edgeId, sharedDataTypes)
		setShowEdgeModal(false)
		setSelectedEdge(null)
	}

	const handleEdgeRevoke = (edgeId: string) => {
		// In a real app, this would remove the edge from the flow state
		console.log('Revoking edge access:', edgeId)
		setShowEdgeModal(false)
		setSelectedEdge(null)
	}

	// Access Request Panel handlers
	const handleApproveSelected = async (
		requestId: string,
		selectedItems: RequestedDataItem[],
	) => {
		const selectedRequest = requests.find((r) => r.id === requestId)
		if (!selectedRequest) return

		// Set loading state
		setApprovingRequests(prev => new Set(prev).add(requestId))

		try {
			// Send webhook with approval data
			await sendApprovalWebhook({
				requestId,
				requester: selectedRequest.requester,
				purpose: selectedRequest.purpose,
				approvedItems: selectedItems,
				approvalType: 'selected',
				timestamp: new Date().toISOString(),
				transferNote: 'Transfer data from GER to USA',
				format: selectedRequest.format,
				validity: selectedRequest.validity,
				retention: selectedRequest.retention,
			})

			// Only update local state after successful webhook
			setRequests((prev) =>
				prev.map((r) => (r.id === requestId ? { ...r, status: 'approved', approvedItems: selectedItems } : r)),
			)

			console.log('Approving selected items for request:', requestId, selectedItems)
		} catch (error) {
			console.error('Failed to approve request:', error)
			// You could show an error toast/notification here
		} finally {
			// Always clear loading state
			setApprovingRequests(prev => {
				const newSet = new Set(prev)
				newSet.delete(requestId)
				return newSet
			})
		}
	}

	const handleApproveAll = async (requestId: string) => {
		const selectedRequest = requests.find((r) => r.id === requestId)
		if (!selectedRequest) return

		// Set loading state
		setApprovingRequests(prev => new Set(prev).add(requestId))

		try {
			// Send webhook with all items approved
			await sendApprovalWebhook({
				requestId,
				requester: selectedRequest.requester,
				purpose: selectedRequest.purpose,
				approvedItems: selectedRequest.requestedItems, // All items
				approvalType: 'all',
				timestamp: new Date().toISOString(),
				transferNote: 'Transfer data from GER to USA',
				format: selectedRequest.format,
				validity: selectedRequest.validity,
				retention: selectedRequest.retention,
			})

			// Only update local state after successful webhook
			setRequests((prev) =>
				prev.map((r) => (r.id === requestId ? { ...r, status: 'approved', approvedItems: selectedRequest.requestedItems } : r)),
			)

			console.log('Approving all items for request:', requestId)
		} catch (error) {
			console.error('Failed to approve request:', error)
			// You could show an error toast/notification here
		} finally {
			// Always clear loading state
			setApprovingRequests(prev => {
				const newSet = new Set(prev)
				newSet.delete(requestId)
				return newSet
			})
		}
	}

	const handleDenyRequest = (requestId: string) => {
		console.log('Denying request:', requestId)
		setRequests((prev) =>
			prev.map((r) => (r.id === requestId ? { ...r, status: 'denied' } : r)),
		)
	}

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file || !file.type.includes('pdf')) return

		setUploading(true)
		setProcessingFileName(file.name)
		try {
			// Convert file to base64
			const fileReader = new FileReader()
			fileReader.onload = async (e) => {
				try {
					const base64 = (e.target?.result as string).split(',')[1]

					// Extract content using Gemini
					const extractedData = await extractPDFContent(base64)

					// Create uploaded document
					const newDoc: UploadedDocument = {
						id: `doc-${Date.now()}`,
						fileName: file.name,
						uploadDate: new Date().toLocaleDateString(),
						pdfBase64: base64,
						extractedData,
					}

					setUploadedDocs((prev) => [...prev, newDoc])
				} catch (error) {
					console.error('Upload failed:', error)
				} finally {
					setUploading(false)
					setProcessingFileName(null)
				}
			}
			fileReader.readAsDataURL(file)
		} catch (error) {
			console.error('File reading failed:', error)
			setUploading(false)
			setProcessingFileName(null)
		}
	}

	const handleDocClick = (doc: UploadedDocument) => {
		setSelectedDoc(doc)
		setShowDocModal(true)
	}

	const handleAddRecord = () => {
		fileInputRef.current?.click()
	}

	return (
		<div className='max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-background'>
			{/* Left Sidebar: Records */}
			<div className='lg:col-span-1 space-y-6'>
				<div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='font-bold text-lg font-merriweather'>My Records</h3>
						<UploadIcon className='w-5 h-5 text-teal-deep' />
					</div>
					<div className='space-y-3 font-sans'>
						{MOCK_RECORDS.map((record) => (
							<div
								key={record.id}
								className='p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 hover:border-mint transition-colors'
							>
								<div className='w-10 h-10 bg-mint/20 flex items-center justify-center rounded-lg text-teal-deep font-bold text-xs'>
									{record.type.substring(0, 2).toUpperCase()}
								</div>
								<div>
									<div className='text-sm font-semibold text-slate-800'>
										{record.title}
									</div>
									<div className='text-xs text-slate-500 font-medium'>
										{record.date} • {record.source}
									</div>
								</div>
							</div>
						))}
						{/* Processing Indicator */}
						{uploading && processingFileName && (
							<div className='p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 opacity-75'>
								<div className='w-10 h-10 bg-lavender/20 flex items-center justify-center rounded-lg text-teal-deep font-bold text-xs'>
									<div className='flex space-x-2'>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{ animationDuration: '0.6s' }}
										></div>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{
												animationDelay: '0.2s',
												animationDuration: '0.6s',
											}}
										></div>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{
												animationDelay: '0.4s',
												animationDuration: '0.6s',
											}}
										></div>
									</div>
								</div>
								<div>
									<div className='text-sm font-semibold text-slate-800'>
										{processingFileName}
									</div>
									<div className='text-xs text-slate-500 font-medium'>
										Processing... • AI Analysis
									</div>
								</div>
							</div>
						)}
						{/* Uploaded Documents */}
						{uploadedDocs.map((doc) => (
							<div
								key={doc.id}
								onClick={() => handleDocClick(doc)}
								className='p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 hover:border-mint transition-colors cursor-pointer'
							>
								<div className='w-10 h-10 bg-lavender/20 flex items-center justify-center rounded-lg text-teal-deep font-bold text-xs'>
									PDF
								</div>
								<div>
									<div className='text-sm font-semibold text-slate-800'>
										{doc.extractedData.title}
									</div>
									<div className='text-xs text-slate-500 font-medium'>
										{doc.uploadDate} • {doc.extractedData.type}
									</div>
								</div>
							</div>
						))}
					</div>
					<div className='flex gap-2 mt-4'>
						<button
							onClick={handleAddRecord}
							disabled={uploading}
							className='flex-1 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl text-sm font-bold hover:border-teal-deep hover:text-teal-deep transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{uploading ? (
								<div className='flex items-center justify-center gap-3'>
									<span>Processing...</span>
									<div className='flex space-x-2'>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{
												animationDuration: '0.6s',
												transform: 'translateY(0px)',
											}}
										></div>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{
												animationDelay: '0.2s',
												animationDuration: '0.6s',
												transform: 'translateY(0px)',
											}}
										></div>
										<div
											className='w-2 h-2 bg-teal-deep rounded-full animate-bounce shadow-lg'
											style={{
												animationDelay: '0.4s',
												animationDuration: '0.6s',
												transform: 'translateY(0px)',
											}}
										></div>
									</div>
								</div>
							) : (
								'+ Add New Record'
							)}
						</button>
						<button
							onClick={() => testGeminiConnection()}
							className='px-4 py-2 bg-mint text-teal-deep rounded-xl text-sm font-bold hover:bg-teal-deep hover:text-white transition-all font-sans'
						>
							Test API
						</button>
					</div>
					<input
						ref={fileInputRef}
						type='file'
						accept='.pdf'
						onChange={handleFileUpload}
						className='hidden'
					/>
				</div>

				<div className='bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-mint/5 border border-mint/10'>
					<div className='flex items-center gap-2 mb-2'>
						<ShieldIcon className='w-5 h-5 text-mint' />
						<h4 className='font-bold font-merriweather'>Vault Status</h4>
					</div>
					<p className='text-sm text-slate-400 leading-relaxed italic font-serif'>
						"{insight}"
					</p>
				</div>
			</div>

			{/* Main Panel: Tabs */}
			<div className='lg:col-span-2 space-y-6'>
				{/* Tab Navigation */}
				<div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-sm'>
					<div className='flex gap-2'>
						<button
							onClick={() => setActiveTab('history')}
							className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
								activeTab === 'history'
									? 'bg-mint text-teal-deep shadow-sm'
									: 'text-slate-500 hover:bg-slate-50'
							}`}
						>
							Access History
						</button>
						<button
							onClick={() => setActiveTab('network')}
							className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
								activeTab === 'network'
									? 'bg-mint text-teal-deep shadow-sm'
									: 'text-slate-500 hover:bg-slate-50'
							}`}
						>
							Access Network
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === 'history' && (
					<div className='min-h-[400px]'>
						<div className='mb-6'>
							<h3 className='font-bold text-2xl font-merriweather'>
								Access Requests
							</h3>
							<p className='text-sm text-slate-600 mt-1'>
								Review and manage third-party requests to access your vault.
							</p>
						</div>

						<AccessRequestsPanel
							requests={requests}
							mockRecords={MOCK_RECORDS}
							uploadedDocs={uploadedDocs}
							onApproveSelected={handleApproveSelected}
							onApproveAll={handleApproveAll}
							onDeny={handleDenyRequest}
							approvingRequests={approvingRequests}
						/>
					</div>
				)}

				{activeTab === 'network' && (
					<div className='space-y-6'>
						<div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm'>
							<h3 className='font-bold text-xl mb-4 flex items-center gap-2 font-merriweather'>
								<ShieldIcon className='w-6 h-6 text-teal-deep' />
								Access Network
							</h3>
							<p className='text-sm text-slate-600 mb-6'>
								Connect entities to grant data access. Click edges to configure
								which data types to share.
							</p>
							<AccessNetworkFlow onEdgeClick={handleEdgeClick} />
						</div>
					</div>
				)}
			</div>

			{/* Edge Configuration Modal */}
			<EdgeConfigModal
				edge={selectedEdge}
				nodes={[
					{ id: 'patient', data: { label: 'You' } },
					{ id: 'doc-1', data: { name: 'Dr. Smith', type: 'Doctor' } },
					{
						id: 'hospital-1',
						data: { name: 'Berlin Central', type: 'Hospital' },
					},
					{
						id: 'research-1',
						data: { name: 'CardioLife Study', type: 'Researcher' },
					},
				]}
				isOpen={showEdgeModal}
				onClose={() => {
					setShowEdgeModal(false)
					setSelectedEdge(null)
				}}
				onSave={handleEdgeSave}
				onRevoke={handleEdgeRevoke}
				mockRecords={MOCK_RECORDS}
				uploadedDocs={uploadedDocs}
			/>

			{/* Document Modal */}
			<DocumentModal
				document={selectedDoc}
				isOpen={showDocModal}
				onClose={() => {
					setShowDocModal(false)
					setSelectedDoc(null)
				}}
			/>

			{/* Chat Assistant */}
			<ChatAssistant documents={uploadedDocs} />
		</div>
	)
}
