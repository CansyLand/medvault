import React, { useState } from 'react'
import { UploadedDocument } from '../types'

interface DocumentModalProps {
	document: UploadedDocument | null
	isOpen: boolean
	onClose: () => void
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
	document,
	isOpen,
	onClose,
}) => {
	const [activeTab, setActiveTab] = useState<'document' | 'raw'>('document')

	if (!isOpen || !document) return null

	const { fileName, uploadDate, pdfBase64, extractedData } = document

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md'>
			<div className='bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200'>
				{/* Header */}
				<div className='p-6 bg-white border-b border-slate-100'>
					<div className='flex justify-between items-start mb-4'>
						<div>
							<h3 className='text-xl font-bold font-merriweather mb-1'>
								{extractedData.title}
							</h3>
							<p className='text-sm text-slate-600 font-medium'>
								{fileName} • Uploaded {uploadDate}
							</p>
						</div>
						<button
							onClick={onClose}
							className='text-slate-400 hover:text-slate-600 transition-colors'
						>
							<svg
								className='w-6 h-6'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>

					{/* Document metadata */}
					<div className='flex gap-4 text-sm'>
						<span className='px-2 py-1 bg-mint/20 text-teal-deep rounded-full font-medium'>
							{extractedData.type}
						</span>
						<span className='px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium'>
							{extractedData.language}
						</span>
						{extractedData.date && (
							<span className='px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium'>
								{extractedData.date}
							</span>
						)}
						{extractedData.provider && (
							<span className='px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium'>
								{extractedData.provider}
							</span>
						)}
					</div>
				</div>

				{/* Tabs */}
				<div className='bg-white p-4 border-b border-slate-100'>
					<div className='flex gap-2'>
						<button
							onClick={() => setActiveTab('document')}
							className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
								activeTab === 'document'
									? 'bg-mint text-teal-deep shadow-sm'
									: 'text-slate-500 hover:bg-slate-50'
							}`}
						>
							Document
						</button>
						<button
							onClick={() => setActiveTab('raw')}
							className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
								activeTab === 'raw'
									? 'bg-mint text-teal-deep shadow-sm'
									: 'text-slate-500 hover:bg-slate-50'
							}`}
						>
							Raw Data
						</button>
					</div>
				</div>

				{/* Content */}
				<div className='p-6 overflow-auto max-h-[60vh]'>
					{activeTab === 'document' && (
						<div className='w-full h-[500px]'>
							<iframe
								src={`data:application/pdf;base64,${pdfBase64}`}
								className='w-full h-full border rounded-lg'
								title={fileName}
							/>
						</div>
					)}

					{activeTab === 'raw' && (
						<div className='space-y-6'>
							{/* Summary */}
							<div className='bg-mint-pale p-4 rounded-xl border border-mint/20'>
								<h4 className='text-sm font-black text-teal-deep uppercase tracking-widest mb-2 font-merriweather'>
									Summary
								</h4>
								<p className='text-slate-700 leading-relaxed text-sm font-serif italic'>
									{extractedData.summary}
								</p>
							</div>

							{/* Structured Fields */}
							<div>
								<h4 className='text-sm font-black text-slate-400 uppercase tracking-widest mb-3 font-merriweather'>
									Structured Fields
								</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
									{Object.entries(extractedData.structuredFields).map(
										([key, value]) => (
											<div
												key={key}
												className='flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200'
											>
												<span className='text-sm font-bold text-slate-700 uppercase tracking-tight'>
													{key}
												</span>
												<span className='text-sm text-slate-600 font-medium'>
													{String(value)}
												</span>
											</div>
										),
									)}
									{Object.keys(extractedData.structuredFields).length === 0 && (
										<p className='text-slate-500 text-sm italic col-span-2'>
											No structured fields extracted from this document.
										</p>
									)}
								</div>
							</div>

							{/* Full Content */}
							<div>
								<h4 className='text-sm font-black text-slate-400 uppercase tracking-widest mb-3 font-merriweather'>
									Full Content
								</h4>
								<div className='bg-white p-4 rounded-xl border border-slate-200 max-h-64 overflow-y-auto'>
									<pre className='text-sm text-slate-700 whitespace-pre-wrap font-sans'>
										{extractedData.content}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
