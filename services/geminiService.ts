import { GoogleGenAI } from '@google/genai'
import { UploadedDocument } from '../types'

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
		const ai = new GoogleGenAI({ apiKey: process.env.API_KEY })
		const response = await ai.models.generateContent({
			model: 'gemini-1.5-flash',
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
