import React, { useState, useEffect } from 'react'
import {
	DataRequest,
	RequestedDataItem,
	MedicalRecord,
	UploadedDocument,
} from '../types'
import {
	ActivityIcon,
	AlertCircleIcon,
	PillIcon,
	ScanIcon,
	ClockIcon,
	InfoIcon,
	CheckIcon,
} from './Icons'

interface AccessRequestsPanelProps {
	requests: DataRequest[]
	mockRecords: MedicalRecord[]
	uploadedDocs: UploadedDocument[]
	onApproveSelected: (
		requestId: string,
		selectedItems: RequestedDataItem[],
	) => void
	onApproveAll: (requestId: string) => void
	onDeny: (requestId: string) => void
	approvingRequests: Set<string>
}

// Helper to get icon based on item type
const getItemIcon = (name: string, source: string) => {
	const nameLower = name.toLowerCase()
	if (
		nameLower.includes('blood') ||
		nameLower.includes('lab') ||
		nameLower.includes('panel')
	) {
		return <ActivityIcon className='w-5 h-5 text-blue-500' />
	}
	if (nameLower.includes('allergy') || nameLower.includes('alert')) {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	if (
		nameLower.includes('medication') ||
		nameLower.includes('rx') ||
		nameLower.includes('prescription')
	) {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	if (
		nameLower.includes('x-ray') ||
		nameLower.includes('mri') ||
		nameLower.includes('imaging') ||
		nameLower.includes('scan') ||
		nameLower.includes('thorax')
	) {
		return <ActivityIcon className='w-5 h-5 text-blue-500' />
	}
	// Default based on source
	if (source === 'Profile') {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	return <ActivityIcon className='w-5 h-5 text-blue-500' />
}

export const AccessRequestsPanel: React.FC<AccessRequestsPanelProps> = ({
	requests,
	mockRecords,
	uploadedDocs,
	onApproveSelected,
	onApproveAll,
	onDeny,
	approvingRequests,
}) => {
	const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
		requests.length > 0 ? requests[0].id : null,
	)
	const [itemToggles, setItemToggles] = useState<Record<string, boolean>>({})

	const selectedRequest =
		requests.find((r) => r.id === selectedRequestId) || null

	// Initialize toggles when selected request changes
	useEffect(() => {
		if (selectedRequest) {
			const initialToggles: Record<string, boolean> = {}
			selectedRequest.requestedItems.forEach((item) => {
				initialToggles[item.id] = item.enabled
			})
			setItemToggles(initialToggles)
		}
	}, [selectedRequest])

	const handleToggle = (itemId: string) => {
		setItemToggles((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}))
	}

	const handleApproveSelected = () => {
		if (!selectedRequest) return
		const selectedItems = selectedRequest.requestedItems.filter(
			(item) => itemToggles[item.id],
		)
		onApproveSelected(selectedRequest.id, selectedItems)
	}

	const handleApproveAll = () => {
		if (!selectedRequest) return
		onApproveAll(selectedRequest.id)
	}

	const handleDeny = () => {
		if (!selectedRequest) return
		onDeny(selectedRequest.id)
	}

	const allRequests = requests.filter((r) => r.status === 'pending' || r.status === 'approved')
	const selectedItemCount = selectedRequest
		? Object.values(itemToggles).filter(Boolean).length
		: 0

	return (
		<div className='flex gap-6 min-h-[500px]'>
			{/* Left Panel - Request List */}
			<div className='w-80 flex-shrink-0 space-y-3'>
				{allRequests.map((request) => (
					<button
						key={request.id}
						onClick={() => setSelectedRequestId(request.id)}
						className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
							selectedRequestId === request.id
								? request.status === 'approved'
									? 'border-green-500 bg-green-50'
									: 'border-blue-500 bg-blue-50'
								: request.status === 'approved'
									? 'border-green-200 bg-green-50/50 hover:border-green-300'
									: 'border-slate-200 bg-white hover:border-slate-300'
						} ${approvingRequests.has(request.id) ? 'opacity-75 pointer-events-none' : ''}`}
						disabled={approvingRequests.has(request.id)}
					>
						<div className='flex items-center justify-between'>
							<div className='flex-1'>
								<div className='flex items-center justify-between mb-2'>
									<h4 className={`font-bold text-base ${
										request.status === 'approved' ? 'text-green-900' : 'text-slate-900'
									}`}>
										{request.requester}
									</h4>
									<span className={`text-xs font-bold px-2 py-1 rounded-full ${
										request.status === 'approved'
											? 'bg-green-100 text-green-700'
											: 'bg-orange-100 text-orange-700'
									}`}>
										{request.status === 'approved' ? 'APPROVED' : 'PENDING'}
									</span>
								</div>
								<p className='text-sm text-slate-600 mt-1'>{request.purpose}</p>
								<div className='flex items-center gap-3 mt-3'>
									<span className='text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded'>
										{request.status === 'approved'
											? `${request.approvedItems?.length || 0} APPROVED`
											: `${request.requestedItems.length} ITEMS`
										}
									</span>
									<span className='text-xs text-slate-400'>
										{request.timestamp}
									</span>
								</div>
							</div>
							{approvingRequests.has(request.id) && (
								<div className='ml-4'>
									<div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
								</div>
							)}
						</div>
					</button>
				))}

				{allRequests.length === 0 && (
					<div className='p-6 text-center text-slate-400'>
						<p className='text-sm'>No requests</p>
					</div>
				)}
			</div>

			{/* Right Panel - Request Details */}
			{!selectedRequest ? (
				<div className='flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center'>
					<div className='text-center text-slate-400'>
						<ClockIcon className='w-12 h-12 mx-auto mb-4 opacity-30' />
						<p className='text-sm font-medium'>Select a request to review</p>
					</div>
				</div>
			) : selectedRequest.status === 'pending' ? (
				<div className='flex-1 bg-white rounded-2xl border border-slate-200 p-6'>
					{/* Header */}
					<div className='flex items-start justify-between mb-6'>
						<div>
							<h3 className='text-xl font-bold text-slate-900 font-merriweather'>
								{selectedRequest.requester}
							</h3>
							<p className='text-sm text-slate-600 mt-1'>
								{selectedRequest.purpose}
							</p>
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full'>
							<ClockIcon className='w-4 h-4 text-orange-500' />
							<span className='text-xs font-bold text-orange-600'>
								Pending Decision
							</span>
						</div>
					</div>

					{/* Data Items */}
					<div className='mb-6'>
						<h4 className='text-sm font-bold text-slate-700 mb-4'>
							Data requested from your vault
						</h4>
						<div className='space-y-3'>
							{selectedRequest.requestedItems.map((item) => (
								<div
									key={item.id}
									className='flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100'
								>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200'>
											{getItemIcon(item.name, item.source)}
										</div>
										<div>
											<div className='font-semibold text-slate-800'>
												{item.name}
											</div>
											<div className='text-xs text-slate-500'>
												Source: {item.source} • {item.accessType}
											</div>
										</div>
									</div>
									{/* Toggle Switch */}
									<button
										onClick={() => handleToggle(item.id)}
										className={`relative w-12 h-7 rounded-full transition-colors ${
											itemToggles[item.id] ? 'bg-blue-500' : 'bg-slate-300'
										}`}
									>
										<div
											className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
												itemToggles[item.id] ? 'translate-x-6' : 'translate-x-1'
											}`}
										/>
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Metadata Row */}
					<div className='grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100'>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Format
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.format || 'FHIR JSON'}
							</div>
						</div>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Validity
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.validity || selectedRequest.duration}
							</div>
						</div>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Retention
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.retention || 'Clinical Duration'}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className='flex items-center justify-end gap-3'>
						<button
							onClick={handleDeny}
							disabled={approvingRequests.has(selectedRequest?.id || '')}
							className='px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Deny Request
						</button>
						<button
							onClick={handleApproveSelected}
							disabled={selectedItemCount === 0 || approvingRequests.has(selectedRequest?.id || '')}
							className='px-6 py-3 text-sm font-bold text-blue-600 border-2 border-blue-500 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
						>
							{approvingRequests.has(selectedRequest?.id || '') && (
								<div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
							)}
							Approve Selected
						</button>
						<button
							onClick={handleApproveAll}
							disabled={approvingRequests.has(selectedRequest?.id || '')}
							className='px-6 py-3 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
						>
							{approvingRequests.has(selectedRequest?.id || '') && (
								<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
							)}
							Approve All
						</button>
					</div>

					{/* Encryption Notice */}
					<div className='mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100'>
						<div className='flex items-start gap-3'>
							<InfoIcon className='w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5' />
							<div>
								<h5 className='font-bold text-slate-800 text-sm'>
									Your data remains encrypted
								</h5>
								<p className='text-xs text-slate-600 mt-1 leading-relaxed'>
									Approving a request doesn't send your raw data to their
									servers permanently. It grants a timed, verifiable
									cryptographic key to view the specific fields you've allowed.
									You can revoke access at any time from the Consents tab.
								</p>
							</div>
						</div>
					</div>
				</div>
			) : selectedRequest.status === 'approved' ? (
				<div className='flex-1 bg-white rounded-2xl border border-slate-200 p-6'>
					{/* Header */}
					<div className='flex items-start justify-between mb-6'>
						<div>
							<h3 className='text-xl font-bold text-slate-900 font-merriweather'>
								{selectedRequest.requester}
							</h3>
							<p className='text-sm text-slate-600 mt-1'>
								{selectedRequest.purpose}
							</p>
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full'>
							<CheckIcon className='w-4 h-4 text-green-500' />
							<span className='text-xs font-bold text-green-600'>
								Access Approved
							</span>
						</div>
					</div>

					{/* Approved Data Items */}
					<div className='mb-6'>
						<h4 className='text-sm font-bold text-slate-700 mb-4'>
							Data access granted to this entity
						</h4>
						<div className='space-y-3'>
							{selectedRequest.approvedItems?.map((item) => (
								<div
									key={item.id}
									className='flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100'
								>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-green-200'>
											{getItemIcon(item.name, item.source)}
										</div>
										<div>
											<div className='font-semibold text-slate-800'>
												{item.name}
											</div>
											<div className='text-xs text-slate-500'>
												Source: {item.source} • {item.accessType}
											</div>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
											<CheckIcon className='w-3 h-3 text-white' />
										</div>
										<span className='text-xs font-bold text-green-700'>APPROVED</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Metadata Row */}
					<div className='grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100'>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Format
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.format || 'FHIR JSON'}
							</div>
						</div>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Validity
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.validity || selectedRequest.duration}
							</div>
						</div>
						<div>
							<div className='text-xs font-bold text-slate-400 uppercase tracking-wide mb-1'>
								Retention
							</div>
							<div className='text-sm font-semibold text-slate-700'>
								{selectedRequest.retention || 'Clinical Duration'}
							</div>
						</div>
					</div>

					{/* Access Granted Notice */}
					<div className='mt-6 p-4 bg-green-50 rounded-xl border border-green-100'>
						<div className='flex items-start gap-3'>
							<CheckIcon className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
							<div>
								<h5 className='font-bold text-slate-800 text-sm'>
									Access has been granted
								</h5>
								<p className='text-xs text-slate-600 mt-1 leading-relaxed'>
									This entity now has cryptographic access to view the approved data fields.
									The data remains encrypted in your vault and access can be revoked at any time
									from the Access Network tab.
								</p>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center'>
					<div className='text-center text-slate-400'>
						<ClockIcon className='w-12 h-12 mx-auto mb-4 opacity-30' />
						<p className='text-sm font-medium'>Select a request to review</p>
					</div>
				</div>
			)}
		</div>
	)
}
