"use client";

import { GoogleGenAI } from "@google/genai";

// Medical document extracted data structure
export interface ExtractedDocumentData {
  type: string; // e.g., "Lab Report", "Prescription", "Imaging"
  language: string;
  title: string;
  date: string | null;
  provider: string | null;
  content: string;
  summary: string;
  structuredFields: Record<string, unknown>;
}

// Get API key from environment
function getApiKey(): string | undefined {
  return typeof window !== "undefined" 
    ? (window as unknown as { ENV_GEMINI_API_KEY?: string }).ENV_GEMINI_API_KEY 
    : process.env.GEMINI_API_KEY;
}

/**
 * Explain a medical data access request in plain language
 */
export async function explainMedicalRequest(request: {
  requester: string;
  purpose: string;
  fields: string[];
}): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "Unable to generate AI explanation - API key not configured. You can still review the request details below.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a patient health data advocate. Explain in simple, empathetic terms to a patient why "${request.requester}" is asking for their ${request.fields.join(", ")} for the purpose of "${request.purpose}". 

Key points to address:
1. Why this specific data is needed for their stated purpose
2. Privacy benefits of sharing only these specific data points instead of their whole medical history
3. What the requester will likely do with this data
4. Any concerns the patient should consider

Keep the response concise (2-3 paragraphs) and reassuring while being honest about privacy implications.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    });
    return response.text || "Unable to generate explanation at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI explanation, but you can still review the request details below.";
  }
}

/**
 * Test the Gemini API connection
 */
export async function testGeminiConnection(): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("❌ Gemini API key not configured");
    return "API key not configured";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello! This is a test message. Please respond with 'Gemini API connection successful!'",
      config: {
        temperature: 0.1,
      },
    });
    console.log("✅ Gemini API Test Response:", response.text);
    return response.text || "Connection successful";
  } catch (error) {
    console.error("❌ Gemini API Test Failed:", error);
    return "Connection failed";
  }
}

/**
 * Analyze health records and generate insights
 */
export async function analyzeHealthInsight(records: Array<{ type: string }>): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "Your data is securely encrypted in your vault.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Based on these medical record types in a patient's vault: ${records.map((r) => r.type).join(", ")}, explain to the patient what a "health profile" summary looks like in MedVault and how it helps them stay in control of their data. Keep it brief (1-2 sentences) and encouraging.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "Your data is securely encrypted in your vault.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Your data is securely encrypted in your vault.";
  }
}

/**
 * Extract content from a PDF document using Gemini's vision capabilities
 */
export async function extractPDFContent(pdfBase64: string): Promise<ExtractedDocumentData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      type: "Other",
      language: "Unknown",
      title: "API Key Not Configured",
      date: null,
      provider: null,
      content: "Please configure the Gemini API key to enable document extraction.",
      summary: "Document processing requires API configuration.",
      structuredFields: {},
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
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

Focus on extracting clinically relevant information. Be thorough but concise.
Return ONLY valid JSON, no markdown formatting.`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as ExtractedDocumentData;
  } catch (error) {
    console.error("Gemini PDF extraction error:", error);
    return {
      type: "Other",
      language: "Unknown",
      title: "Document Processing Failed",
      date: null,
      provider: null,
      content: "Unable to extract content from this document.",
      summary: "Document processing failed. Please try again or contact support.",
      structuredFields: {},
    };
  }
}

/**
 * Generate a summary of multiple medical records for sharing context
 */
export async function generateRecordsSummary(
  records: Array<{ key: string; value: string }>
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return `${records.length} medical record(s) ready to share.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const recordsList = records.map((r) => `- ${r.key}: ${r.value}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Summarize these medical records in 1-2 sentences for a patient who is about to share them with a healthcare provider:

${recordsList}

Be brief and focus on what type of information is being shared.`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 150,
      },
    });
    return response.text || `${records.length} medical record(s) ready to share.`;
  } catch (error) {
    console.error("Gemini summary error:", error);
    return `${records.length} medical record(s) ready to share.`;
  }
}
