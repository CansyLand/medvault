import React, { useState, useEffect, useRef } from 'react'
import { DataRequest, MedicalRecord, UploadedDocument } from '../types'
import {
	explainMedicalRequest,
	analyzeHealthInsight,
	extractPDFContent,
} from '../services/geminiService'
import {
	ShieldIcon,
	LockIcon,
	HistoryIcon,
	CheckIcon,
	UploadIcon,
} from './Icons'
import { AccessNetworkFlow } from './AccessNetworkFlow'
import { EdgeConfigModal } from './EdgeConfigModal'
import { DocumentModal } from './DocumentModal'
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
		requester: 'CardioLife Specialty',
		purpose: 'Pre-surgical assessment for aortic valve',
		fields: ['MRI.scan', 'Medications.current'],
		duration: '30 days',
		status: 'pending',
		timestamp: '2 mins ago',
	},
]

export const DemoView: React.FC = () => {
	const [requests, setRequests] = useState<DataRequest[]>(INITIAL_REQUESTS)
	const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(
		null,
	)
	const [explanation, setExplanation] = useState<string | null>(null)
	const [loadingExplanation, setLoadingExplanation] = useState(false)
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
	const fileInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const fetchInsight = async () => {
			const res = await analyzeHealthInsight(MOCK_RECORDS)
			setInsight(res || '')
		}
		fetchInsight()
	}, [])

	const handleReview = async (req: DataRequest) => {
		setSelectedRequest(req)
		setLoadingExplanation(true)
		const expl = await explainMedicalRequest({
			requester: req.requester,
			purpose: req.purpose,
			fields: req.fields,
		})
		setExplanation(expl || '')
		setLoadingExplanation(false)
	}

	const handleDecision = (id: string, decision: 'approved' | 'denied') => {
		setRequests((prev) =>
			prev.map((r) => (r.id === id ? { ...r, status: decision } : r)),
		)
		setSelectedRequest(null)
		setExplanation(null)
	}

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

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file || !file.type.includes('pdf')) return

		setUploading(true)
		try {
			// Convert file to base64
			const fileReader = new FileReader()
			fileReader.onload = async (e) => {
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
			}
			fileReader.readAsDataURL(file)
		} catch (error) {
			console.error('Upload failed:', error)
		}
		setUploading(false)
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
					<button
						onClick={handleAddRecord}
						disabled={uploading}
						className='w-full mt-4 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl text-sm font-bold hover:border-teal-deep hover:text-teal-deep transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{uploading ? 'Processing...' : '+ Add New Record'}
					</button>
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
					<div className='bg-white p-6 rounded-2xl border border-slate-200 min-h-[400px] shadow-sm'>
						<h3 className='font-bold text-xl mb-6 flex items-center gap-2 font-merriweather'>
							<HistoryIcon className='w-6 h-6 text-slate-400' />
							Access History
						</h3>

						<div className='space-y-4 font-sans'>
							{requests.map((req) => (
								<div
									key={req.id}
									className={`p-4 rounded-2xl border transition-all ${req.status === 'pending' ? 'bg-mint-pale border-mint shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
								>
									<div className='flex flex-wrap justify-between items-start gap-4'>
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-1'>
												<span className='font-bold text-slate-900 text-lg'>
													{req.requester}
												</span>
												<span className='text-[10px] px-2 py-0.5 bg-mint/30 text-teal-deep rounded-full font-black uppercase tracking-wider'>
													Pending Review
												</span>
											</div>
											<p className='text-sm text-slate-600 mb-2 font-medium'>
												{req.purpose}
											</p>
											<div className='flex flex-wrap gap-2'>
												{req.fields.map((f) => (
													<span
														key={f}
														className='text-[10px] uppercase tracking-wider font-black bg-white px-2 py-1 rounded border border-slate-200 text-slate-500'
													>
														{f}
													</span>
												))}
											</div>
										</div>
										<div className='flex flex-col items-end gap-2'>
											<span className='text-[10px] text-slate-400 font-bold uppercase tracking-tight'>
												{req.timestamp}
											</span>
											{req.status === 'pending' ? (
												<button
													onClick={() => handleReview(req)}
													className='bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-teal-deep transition-all shadow-md'
												>
													Review
												</button>
											) : (
												<div className='flex items-center gap-1 text-xs font-black uppercase tracking-widest capitalize'>
													{req.status === 'approved' ? (
														<>
															<CheckIcon className='w-4 h-4 text-green-500' />{' '}
															Authorized
														</>
													) : (
														<span className='text-red-500'>Denied</span>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>

						{!selectedRequest &&
							requests.filter((r) => r.status === 'pending').length === 0 && (
								<div className='flex flex-col items-center justify-center py-20 text-slate-400'>
									<ShieldIcon className='w-12 h-12 mb-4 opacity-10' />
									<p className='font-bold uppercase tracking-widest text-xs opacity-50'>
										Secure & Silent
									</p>
								</div>
							)}
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

			{/* Modal: Review Detail */}
			{selectedRequest && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md'>
					<div className='bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
						<div className='p-6 bg-white border-b border-slate-100'>
							<h3 className='text-xl font-bold font-merriweather'>
								Security Review
							</h3>
							<p className='text-teal-deep font-black text-[10px] uppercase tracking-[0.2em] mt-1'>
								Origin: {selectedRequest.requester}
							</p>
						</div>
						<div className='p-6 space-y-6'>
							<div className='bg-mint-pale p-4 rounded-xl border border-mint/20'>
								<h4 className='text-[10px] font-black text-teal-deep uppercase tracking-widest mb-2 font-merriweather'>
									AI Plain-Language Summary
								</h4>
								{loadingExplanation ? (
									<div className='flex items-center gap-3 py-2 text-teal-deep font-medium font-sans'>
										<div className='animate-spin rounded-full h-4 w-4 border-2 border-teal-deep border-t-transparent'></div>
										Decoding request intent...
									</div>
								) : (
									<p className='text-slate-700 leading-relaxed text-sm font-serif italic'>
										{explanation}
									</p>
								)}
							</div>

							<div>
								<h4 className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-merriweather'>
									Fields Requested
								</h4>
								<div className='space-y-2 font-sans'>
									{selectedRequest.fields.map((field) => (
										<div
											key={field}
											className='flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200'
										>
											<span className='text-sm font-bold text-slate-700 uppercase tracking-tight'>
												{field}
											</span>
											<div className='w-2 h-2 rounded-full bg-teal-deep shadow-[0_0_8px_rgba(15,118,110,1)]'></div>
										</div>
									))}
								</div>
							</div>

							<div className='grid grid-cols-2 gap-4 pt-4 font-sans'>
								<button
									onClick={() => handleDecision(selectedRequest.id, 'denied')}
									className='py-4 px-4 rounded-full border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors'
								>
									Block
								</button>
								<button
									onClick={() => handleDecision(selectedRequest.id, 'approved')}
									className='py-4 px-4 rounded-full bg-mint text-teal-deep font-black uppercase tracking-widest text-xs hover:bg-teal-deep hover:text-white transition-all shadow-lg shadow-mint/20'
								>
									Authorize
								</button>
							</div>
							<p className='text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight'>
								All authorizations are recorded on the append-only MedVault log.
							</p>
						</div>
					</div>
				</div>
			)}

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
		</div>
	)
}
