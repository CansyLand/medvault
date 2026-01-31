import { GoogleGenAI } from '@google/genai'
import { UploadedDocument, ChatMessage, PageContent } from '../types'

// Fix: Recommended pattern is to create a new instance before each call to ensure latest configuration.
export const explainMedicalRequest = async (request: {
	requester: string
	purpose: string
	fields: string[]
}) => {
	try {
		const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })
		const response = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents: `Explain in simple, empathetic terms to a patient why ${request.requester} is asking for their ${request.fields.join(', ')} for the purpose of "${request.purpose}". Highlight the privacy benefits of sharing only these specific data points instead of their whole medical history.`,
			config: {
				temperature: 0.7,
				maxOutputTokens: 300,
				// Fix: According to guidelines, both maxOutputTokens and thinkingBudget must be set together.
				thinkingConfig: { thinkingBudget: 100 },
			},
		})
		return response.text
	} catch (error) {
		console.error('Gemini API Error:', error)
		return 'XNAMEX is currently unable to generate an AI explanation, but you can still review the request details below.'
	}
}

export const testGeminiConnection = async () => {
	try {
		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
		const response = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents:
				"Hello! This is a test message. Please respond with 'Gemini API connection successful!'",
			config: {
				temperature: 0.1,
			},
		})
		console.log('✅ Gemini API Test Response:', response.text)
		return response.text
	} catch (error) {
		console.error('❌ Gemini API Test Failed:', error)
		return 'Connection failed'
	}
}

export const analyzeHealthInsight = async (records: any[]) => {
	try {
		const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })
		const response = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents: `Based on these mock medical record types: ${records.map((r) => r.type).join(', ')}, explain to a patient what a "health profile" summary looks like in XNAMEX and how it helps them stay in control of their data. Keep it brief and encouraging.`,
			config: {
				temperature: 0.7,
			},
		})
		return response.text
	} catch (error) {
		console.error('Gemini API Error:', error)
		return 'Your data is securely encrypted in your vault.'
	}
}

export const extractPDFContent = async (
	pdfBase64: string,
): Promise<UploadedDocument['extractedData']> => {
	try {
		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
		const response = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents: [
				{
					parts: [
						{ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
						{
							text: `Analyze this medical document and return a JSON object with the following structure:
            {
              "type": "Document classification (Lab Report, Prescription, Imaging, Clinical Notes, Insurance, Other)",
              "language": "Detected language (English, German, etc.)",
              "title": "Document title or generated descriptive title",
              "date": "Date found in document (YYYY-MM-DD format if possible, or null)",
              "provider": "Healthcare provider name if found, or null",
              "content": "Full text content extracted from the document",
              "summary": "2-3 sentence summary of the document's key information",
              "structuredFields": {
                // Key-value pairs of important medical data points
                // Examples: test results, medications, diagnoses, vital signs, etc.
              }
            }
            Focus on extracting clinically relevant information and be thorough but concise.`,
						},
					],
				},
			],
			config: {
				temperature: 0.3,
				responseMimeType: 'application/json',
			},
		})

		const result = JSON.parse(response.text)
		return result
	} catch (error) {
		console.error('Gemini PDF extraction error:', error)
		return {
			type: 'Other',
			language: 'Unknown',
			title: 'Document Processing Failed',
			date: null,
			provider: null,
			content: 'Unable to extract content from this document.',
			summary:
				'Document processing failed. Please try again or contact support.',
			structuredFields: {},
		}
	}
}

export const chatWithDocuments = async (
	userMessage: string,
	documents: UploadedDocument[],
	chatHistory: ChatMessage[],
	pageContent?: PageContent,
): Promise<string> => {
	try {
		const hasDocuments = documents.length > 0
		const hasPageContent = pageContent && pageContent.text.trim().length > 0

		if (!hasDocuments && !hasPageContent) {
			return "I don't see any documents uploaded or page content available. Please upload some medical documents or include page content to help answer questions."
		}

		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

		// Phase 1: Determine which documents are relevant (only if we have documents)
		let relevantIndices: number[] = []
		let contextDocs: UploadedDocument[] = []

		if (hasDocuments) {
			const documentSummaries = documents.map((doc, index) => ({
				index,
				title: doc.extractedData.title,
				type: doc.extractedData.type,
				date: doc.extractedData.date || 'Unknown date',
				summary: doc.extractedData.summary,
			}))

			const relevancePrompt = `Given the user's question: "${userMessage}"

Here are the available documents:
${documentSummaries
	.map(
		(doc) => `Document ${doc.index + 1}: ${doc.title} (${doc.type}, ${doc.date})
Summary: ${doc.summary}`,
	)
	.join('\n\n')}

${hasPageContent ? `Current page content is also available: ${pageContent.title} (${pageContent.url})` : ''}

Please analyze which documents are most relevant to answer this question. Return only a JSON array of document indices (0-based) that should be included for context. If no documents are relevant, return an empty array.

Example response: [0, 2, 4] or []`

			const relevanceResponse = await ai.models.generateContent({
				model: 'gemini-3-flash-preview',
				contents: relevancePrompt,
				config: {
					temperature: 0.1,
					responseMimeType: 'application/json',
				},
			})

			try {
				relevantIndices = JSON.parse(relevanceResponse.text)
				// Filter to ensure valid indices
				relevantIndices = relevantIndices.filter(
					(i) => Number.isInteger(i) && i >= 0 && i < documents.length,
				)
			} catch (parseError) {
				console.warn(
					'Failed to parse relevance response, using all documents:',
					parseError,
				)
				relevantIndices = documents.map((_, i) => i)
			}

			contextDocs = relevantIndices.map((index) => documents[index])
		}

		// Phase 2: Answer the question with relevant document content and/or page content
		const contextPrompt = `You are a helpful AI assistant answering questions about the user's medical information.

${
	contextDocs.length > 0
		? `Relevant document content:
${contextDocs
	.map(
		(
			doc,
			i,
		) => `Document ${i + 1}: ${doc.extractedData.title} (${doc.extractedData.type})
Full content: ${doc.extractedData.content}`,
	)
	.join('\n\n')}`
		: ''
}

${
	hasPageContent
		? `${contextDocs.length > 0 ? '\n\n' : ''}Current page content from "${pageContent.title}" (${pageContent.url}):
${pageContent.text}`
		: ''
}

${chatHistory.length > 0 ? `\n\nPrevious conversation:\n${chatHistory.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}\n\n` : ''}

User's question: ${userMessage}

Please provide a helpful, accurate answer based on the available information (documents and/or page content). Be concise but thorough. If the question cannot be answered from the available information, say so clearly.`

		const answerResponse = await ai.models.generateContent({
			model: 'gemini-3-flash-preview',
			contents: contextPrompt,
			config: {
				temperature: 0.7,
				maxOutputTokens: 1000,
			},
		})

		return answerResponse.text.trim()
	} catch (error) {
		console.error('Chat with documents error:', error)
		return 'I apologize, but I encountered an error while processing your question. Please try again.'
	}
}
