import React, { useState, useEffect } from 'react'
import { Edge } from '@xyflow/react'
import { CheckIcon } from './Icons'

interface EdgeConfigModalProps {
	edge: Edge | null
	nodes: any[]
	isOpen: boolean
	onClose: () => void
	onSave: (edgeId: string, sharedDataTypes: string[]) => void
	onRevoke: (edgeId: string) => void
}

// Available data types from existing MOCK_RECORDS
const AVAILABLE_DATA_TYPES = ['Imaging', 'Lab', 'Rx']

export const EdgeConfigModal: React.FC<EdgeConfigModalProps> = ({
	edge,
	nodes,
	isOpen,
	onClose,
	onSave,
	onRevoke,
}) => {
	const [selectedTypes, setSelectedTypes] = useState<string[]>([])

	useEffect(() => {
		if (edge && edge.data) {
			setSelectedTypes(edge.data.sharedDataTypes || [])
		}
	}, [edge])

	if (!isOpen || !edge) return null

	const sourceNode = nodes.find((n) => n.id === edge.source)
	const targetNode = nodes.find((n) => n.id === edge.target)

	const handleTypeToggle = (type: string) => {
		setSelectedTypes((prev) =>
			prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
		)
	}

	const handleSave = () => {
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
							Select Data Types to Share
						</h4>
						<div className='space-y-3 font-sans'>
							{AVAILABLE_DATA_TYPES.map((type) => (
								<label
									key={type}
									className='flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-mint transition-colors cursor-pointer'
								>
									<div className='flex items-center gap-3'>
										<div
											className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
												selectedTypes.includes(type)
													? 'bg-mint border-teal-deep'
													: 'border-slate-300 bg-white'
											}`}
										>
											{selectedTypes.includes(type) && (
												<CheckIcon className='w-3 h-3 text-teal-deep' />
											)}
										</div>
										<span className='text-sm font-semibold text-slate-700'>
											{type}
										</span>
									</div>
									<input
										type='checkbox'
										checked={selectedTypes.includes(type)}
										onChange={() => handleTypeToggle(type)}
										className='sr-only'
									/>
								</label>
							))}
						</div>
					</div>

					<div className='bg-mint-pale p-4 rounded-xl border border-mint/20'>
						<div className='flex items-center justify-between'>
							<div>
								<div className='text-sm font-semibold text-teal-deep'>
									Currently Sharing
								</div>
								<div className='text-xs text-slate-600'>
									{selectedTypes.length} of {AVAILABLE_DATA_TYPES.length} data
									types
								</div>
							</div>
							<div className='flex gap-1'>
								{AVAILABLE_DATA_TYPES.map((type) => (
									<div
										key={type}
										className={`w-2 h-2 rounded-full ${
											selectedTypes.includes(type)
												? 'bg-teal-deep'
												: 'bg-slate-300'
										}`}
									/>
								))}
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
