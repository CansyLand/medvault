import React, { useState, useEffect, useMemo } from 'react'
import { Edge } from '@xyflow/react'
import { MedicalRecord, UploadedDocument } from '../types'
import {
	ActivityIcon,
	AlertCircleIcon,
} from './Icons'

interface DataItem {
	id: string
	name: string
	source: 'Documents' | 'Profile'
	type: string
}

interface EdgeConfigModalProps {
	edge: Edge | null
	nodes: any[]
	isOpen: boolean
	onClose: () => void
	onSave: (edgeId: string, sharedDataTypes: string[]) => void
	onRevoke: (edgeId: string) => void
	mockRecords: MedicalRecord[]
	uploadedDocs: UploadedDocument[]
}

// Helper to get icon based on item type
const getItemIcon = (name: string, source: string) => {
	const nameLower = name.toLowerCase()
	if (nameLower.includes('blood') || nameLower.includes('lab') || nameLower.includes('panel')) {
		return <ActivityIcon className='w-5 h-5 text-blue-500' />
	}
	if (nameLower.includes('allergy') || nameLower.includes('alert')) {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	if (nameLower.includes('medication') || nameLower.includes('rx') || nameLower.includes('prescription')) {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	if (nameLower.includes('x-ray') || nameLower.includes('mri') || nameLower.includes('imaging') || nameLower.includes('scan') || nameLower.includes('thorax')) {
		return <ActivityIcon className='w-5 h-5 text-blue-500' />
	}
	// Default based on source
	if (source === 'Profile') {
		return <AlertCircleIcon className='w-5 h-5 text-orange-500' />
	}
	return <ActivityIcon className='w-5 h-5 text-blue-500' />
}

export const EdgeConfigModal: React.FC<EdgeConfigModalProps> = ({
	edge,
	nodes,
	isOpen,
	onClose,
	onSave,
	onRevoke,
	mockRecords,
	uploadedDocs,
}) => {
	const [selectedIds, setSelectedIds] = useState<string[]>([])

	// Generate data items from mock records and uploaded documents
	const dataItems = useMemo<DataItem[]>(() => {
		const items: DataItem[] = []
		
		// Add mock records
		mockRecords.forEach((record) => {
			items.push({
				id: `record-${record.id}`,
				name: record.title,
				source: 'Documents',
				type: record.type,
			})
		})
		
		// Add uploaded documents
		uploadedDocs.forEach((doc) => {
			items.push({
				id: `doc-${doc.id}`,
				name: doc.extractedData.title,
				source: 'Documents',
				type: doc.extractedData.type,
			})
		})
		
		return items
	}, [mockRecords, uploadedDocs])

	useEffect(() => {
		if (edge && edge.data) {
			// Convert sharedDataTypes to item IDs if they exist
			const existingTypes = edge.data.sharedDataTypes || []
			// Try to match existing types to item IDs
			const matchedIds = dataItems
				.filter((item) => existingTypes.includes(item.type) || existingTypes.includes(item.id))
				.map((item) => item.id)
			setSelectedIds(matchedIds)
		}
	}, [edge, dataItems])

	if (!isOpen || !edge) return null

	const sourceNode = nodes.find((n) => n.id === edge.source)
	const targetNode = nodes.find((n) => n.id === edge.target)

	const handleToggle = (itemId: string) => {
		setSelectedIds((prev) =>
			prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
		)
	}

	const handleSave = () => {
		// Convert selected IDs back to data types for compatibility
		const selectedTypes = dataItems
			.filter((item) => selectedIds.includes(item.id))
			.map((item) => item.id)
		onSave(edge.id, selectedTypes)
		onClose()
	}

	const handleRevoke = () => {
		onRevoke(edge.id)
		onClose()
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md'>
			<div className='bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200'>
				<div className='p-6 bg-white border-b border-slate-100'>
					<h3 className='text-xl font-bold font-merriweather'>
						Configure Data Access
					</h3>
					<p className='text-teal-deep font-black text-[10px] uppercase tracking-[0.2em] mt-1'>
						{sourceNode?.data?.name || sourceNode?.data?.label || 'Source'} ↔{' '}
						{targetNode?.data?.name || targetNode?.data?.label || 'Target'}
					</p>
				</div>

				<div className='p-6 space-y-6'>
					<div>
						<h4 className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-merriweather'>
							Select Data to Share
						</h4>
						<div className='space-y-3 font-sans max-h-64 overflow-y-auto'>
							{dataItems.length > 0 ? (
								dataItems.map((item) => (
									<div
										key={item.id}
										onClick={() => handleToggle(item.id)}
										className='flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 transition-colors cursor-pointer'
									>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200'>
												{getItemIcon(item.name, item.source)}
											</div>
											<div>
												<div className='font-semibold text-slate-800 text-sm'>
													{item.name}
												</div>
												<div className='text-xs text-slate-500'>
													Source: {item.source} • Read Access
												</div>
											</div>
										</div>
										{/* Toggle Switch */}
										<button
											onClick={(e) => {
												e.stopPropagation()
												handleToggle(item.id)
											}}
											className={`relative w-12 h-7 rounded-full transition-colors ${
												selectedIds.includes(item.id)
													? 'bg-blue-500'
													: 'bg-slate-300'
											}`}
										>
											<div
												className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
													selectedIds.includes(item.id)
														? 'translate-x-6'
														: 'translate-x-1'
												}`}
											/>
										</button>
									</div>
								))
							) : (
								<div className='p-4 text-center text-slate-400 text-sm'>
									No records available. Upload documents to share them.
								</div>
							)}
						</div>
					</div>

					<div className='bg-mint-pale p-4 rounded-xl border border-mint/20'>
						<div className='flex items-center justify-between'>
							<div>
								<div className='text-sm font-semibold text-teal-deep'>
									Currently Sharing
								</div>
								<div className='text-xs text-slate-600'>
									{selectedIds.length} of {dataItems.length} items
								</div>
							</div>
							<div className='flex gap-1 flex-wrap max-w-[100px] justify-end'>
								{dataItems.slice(0, 6).map((item) => (
									<div
										key={item.id}
										className={`w-2 h-2 rounded-full ${
											selectedIds.includes(item.id)
												? 'bg-teal-deep'
												: 'bg-slate-300'
										}`}
									/>
								))}
								{dataItems.length > 6 && (
									<span className='text-xs text-slate-400'>...</span>
								)}
							</div>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4 font-sans'>
						<button
							onClick={onClose}
							className='py-4 px-4 rounded-full border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors'
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className='py-4 px-4 rounded-full bg-mint text-teal-deep font-black uppercase tracking-widest text-xs hover:bg-teal-deep hover:text-white transition-all shadow-lg shadow-mint/20'
						>
							Save Access
						</button>
					</div>

					<button
						onClick={handleRevoke}
						className='w-full py-3 px-4 rounded-full border-2 border-red-200 bg-red-50 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-colors'
					>
						Revoke All Access
					</button>

					<p className='text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight'>
						Changes are recorded on the append-only MedVault log.
					</p>
				</div>
			</div>
		</div>
	)
}
