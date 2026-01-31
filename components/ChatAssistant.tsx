import React, { useState, useRef, useEffect } from 'react'
import { ChatIcon } from './Icons'
import { chatWithDocuments } from '../services/geminiService'
import { UploadedDocument, ChatMessage } from '../types'

interface ChatAssistantProps {
	documents: UploadedDocument[]
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ documents }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isOpen])

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return

		const userMessage: ChatMessage = {
			id: `msg-${Date.now()}`,
			role: 'user',
			content: inputValue.trim(),
			timestamp: new Date(),
		}

		setMessages((prev) => [...prev, userMessage])
		setInputValue('')
		setIsLoading(true)

		try {
			const response = await chatWithDocuments(
				userMessage.content,
				documents,
				messages,
			)

			const assistantMessage: ChatMessage = {
				id: `msg-${Date.now() + 1}`,
				role: 'assistant',
				content: response,
				timestamp: new Date(),
			}

			setMessages((prev) => [...prev, assistantMessage])
		} catch (error) {
			console.error('Chat error:', error)
			const errorMessage: ChatMessage = {
				id: `msg-${Date.now() + 1}`,
				role: 'assistant',
				content:
					'I apologize, but I encountered an error while processing your question. Please try again.',
				timestamp: new Date(),
			}
			setMessages((prev) => [...prev, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	return (
		<>
			{/* Floating Chat Button */}
			<button
				onClick={() => setIsOpen(true)}
				className={`fixed bottom-6 right-6 w-14 h-14 bg-teal-deep hover:bg-teal-deep/90 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-40 ${
					documents.length > 0 ? 'animate-pulse' : ''
				}`}
				aria-label='Open chat assistant'
			>
				<ChatIcon className='w-6 h-6' />
			</button>

			{/* Chat Panel */}
			{isOpen && (
				<div className='fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200'>
					{/* Header */}
					<div className='bg-mint px-6 py-4 flex items-center justify-between border-b border-slate-200'>
						<h3 className='font-bold text-teal-deep text-lg'>
							Ask about your documents
						</h3>
						<button
							onClick={() => setIsOpen(false)}
							className='text-teal-deep hover:text-teal-deep/80 transition-colors'
							aria-label='Close chat'
						>
							<svg
								className='w-6 h-6'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
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

					{/* Messages Area */}
					<div className='flex-1 overflow-y-auto p-4 space-y-4'>
						{messages.length === 0 ? (
							<div className='text-center text-slate-500 mt-8'>
								<ChatIcon className='w-12 h-12 mx-auto mb-4 opacity-50' />
								<p className='text-sm'>
									{documents.length > 0
										? 'Ask me anything about your uploaded documents!'
										: 'Upload some documents first, then ask me questions about them!'}
								</p>
							</div>
						) : (
							messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
											message.role === 'user'
												? 'bg-teal-deep text-white'
												: 'bg-slate-100 text-slate-800'
										}`}
									>
										{message.content}
									</div>
								</div>
							))
						)}

						{/* Loading indicator */}
						{isLoading && (
							<div className='flex justify-start'>
								<div className='bg-slate-100 px-4 py-3 rounded-2xl'>
									<div className='flex space-x-1'>
										<div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'></div>
										<div
											className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
											style={{ animationDelay: '0.1s' }}
										></div>
										<div
											className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'
											style={{ animationDelay: '0.2s' }}
										></div>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className='p-4 border-t border-slate-200'>
						<div className='flex gap-2'>
							<input
								ref={inputRef}
								type='text'
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='Ask a question about your documents...'
								className='flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent text-sm'
								disabled={isLoading}
							/>
							<button
								onClick={handleSendMessage}
								disabled={!inputValue.trim() || isLoading}
								className='px-6 py-3 bg-teal-deep hover:bg-teal-deep/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium text-sm'
							>
								Send
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Backdrop */}
			{isOpen && (
				<div
					className='fixed inset-0 bg-black/20 -z-10'
					onClick={() => setIsOpen(false)}
				/>
			)}
		</>
	)
}
