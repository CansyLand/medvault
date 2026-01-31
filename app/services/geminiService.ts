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

/**
 * Chat with documents using a two-phase approach:
 * 1. Determine which documents are relevant to the question
 * 2. Answer the question using relevant document content
 */
export async function chatWithDocuments(
  userMessage: string,
  records: Array<{ key: string; value: string }>,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "I need the Gemini API to be configured to answer questions about your documents.";
  }

  try {
    if (records.length === 0) {
      return "I don't see any documents uploaded yet. Please upload some medical documents first so I can help answer questions about them.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Phase 1: Determine which documents are relevant
    const documentSummaries = records.map((doc, index) => ({
      index,
      key: doc.key,
      preview: doc.value.slice(0, 200),
    }));

    const relevancePrompt = `Given the user's question: "${userMessage}"

Here are the available medical records:
${documentSummaries
  .map((doc) => `Document ${doc.index + 1}: ${doc.key}\nPreview: ${doc.preview}...`)
  .join("\n\n")}

Please analyze which documents are most relevant to answer this question. Return only a JSON array of document indices (0-based) that should be included for context. If no documents are relevant, return an empty array.

Example response: [0, 2, 4] or []`;

    const relevanceResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: relevancePrompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    let relevantIndices: number[] = [];
    try {
      relevantIndices = JSON.parse(relevanceResponse.text || "[]");
      // Filter to ensure valid indices
      relevantIndices = relevantIndices.filter(
        (i) => Number.isInteger(i) && i >= 0 && i < records.length
      );
    } catch (parseError) {
      console.warn("Failed to parse relevance response, using all documents:", parseError);
      relevantIndices = records.map((_, i) => i);
    }

    // Phase 2: Answer the question with relevant document content
    const contextDocs = relevantIndices.map((index) => records[index]);

    const contextPrompt =
      contextDocs.length > 0
        ? `You are a helpful AI assistant answering questions about the user's medical documents stored in their encrypted vault.

Relevant document content:
${contextDocs
  .map((doc, i) => `Document ${i + 1}: ${doc.key}\nContent: ${doc.value}`)
  .join("\n\n")}

${chatHistory.length > 0 ? `Previous conversation:\n${chatHistory.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")}\n\n` : ""}

User's question: ${userMessage}

Please provide a helpful, accurate answer based on the document content. Be concise but thorough. If the question cannot be answered from the available documents, say so clearly.`
        : `You are a helpful AI assistant answering questions about the user's medical documents stored in their encrypted vault.

No documents were found to be relevant to the question: "${userMessage}"

Please respond appropriately, explaining that you don't have relevant information from the uploaded documents.`;

    const answerResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contextPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return answerResponse.text?.trim() || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat with documents error:", error);
    return "I apologize, but I encountered an error while processing your question. Please try again.";
  }
}
