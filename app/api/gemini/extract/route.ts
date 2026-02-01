import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ExtractedDocumentData {
  type: string;
  language: string;
  title: string;
  date?: string;
  provider?: string;
  summary?: string;
  content?: string;
  structuredFields?: Record<string, string | number>;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log("[Gemini Extract] API key configured:", !!apiKey, apiKey ? `(${apiKey.slice(0, 10)}...)` : "");
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { pdfBase64 } = await request.json();
    console.log("[Gemini Extract] PDF data received, length:", pdfBase64?.length || 0);
    
    if (!pdfBase64) {
      return NextResponse.json(
        { error: "No PDF data provided" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    
    console.log("[Gemini Extract] Calling Gemini API...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              text: `You are a medical document analyzer. Extract ALL text and information from this PDF document.

Return a SINGLE JSON object (NOT an array) with these exact fields:

{
  "type": "Lab Report" or "Prescription" or "Imaging" or "Clinical Notes" or "Insurance" or "Other",
  "language": "detected language (e.g., English, German, Spanish)",
  "title": "document title or a descriptive title based on content",
  "date": "date in YYYY-MM-DD format if found, or null",
  "provider": "healthcare provider, hospital, or facility name if found, or null",
  "summary": "2-3 sentence summary of what this document contains",
  "content": "Extract and include ALL readable text from the document here. Include test results, diagnoses, medications, notes, and any other medical information.",
  "structuredFields": {}
}

IMPORTANT RULES:
1. Return a SINGLE JSON object, NOT an array
2. The "content" field MUST contain the actual text from the document - do not leave it empty
3. Include all medical information you can extract`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    console.log("[Gemini Extract] Response received, type:", typeof response);
    console.log("[Gemini Extract] Response keys:", Object.keys(response || {}));
    
    const text = response.text || "{}";
    
    console.log("[Gemini Extract] Raw response:", text.slice(0, 500));
    
    let data: ExtractedDocumentData;
    try {
      let parsed = JSON.parse(text);
      
      // Handle array response - Gemini sometimes returns [{...}] instead of {...}
      if (Array.isArray(parsed)) {
        console.log("[Gemini Extract] Response is array, using first element");
        parsed = parsed[0] || {};
      }
      
      console.log("[Gemini Extract] Parsed keys:", Object.keys(parsed));
      
      // Handle different possible response formats
      data = {
        type: parsed.type || parsed.document_type || parsed.documentType || "Other",
        language: parsed.language || parsed.lang || "Unknown",
        title: parsed.title || parsed.document_title || parsed.documentTitle || "Document",
        date: parsed.date || parsed.document_date || null,
        provider: parsed.provider || parsed.healthcare_provider || parsed.facility || null,
        summary: parsed.summary || parsed.document_summary || "",
        content: parsed.content || parsed.text || parsed.extracted_text || parsed.full_text || "",
        structuredFields: parsed.structuredFields || parsed.structured_fields || parsed.fields || {},
      };
      
      console.log("[Gemini Extract] Normalized:", {
        type: data.type,
        title: data.title,
        contentLength: data.content?.length || 0,
        summaryLength: data.summary?.length || 0,
      });
    } catch (parseError) {
      console.error("[Gemini Extract] JSON parse failed:", parseError);
      console.log("[Gemini Extract] Raw text:", text.slice(0, 200));
      data = {
        type: "Other",
        language: "Unknown",
        title: "Document",
        summary: text.slice(0, 500),
        content: text,
      };
    }

    // Ensure content is not empty - use summary as fallback
    if (!data.content && data.summary) {
      data.content = data.summary;
    }
    
    // If still empty, note that in the content
    if (!data.content) {
      data.content = "Document uploaded but content extraction failed. Please try again.";
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini extraction error:", errorMessage, error);
    
    // Check for rate limiting errors
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("Resource exhausted")) {
      return NextResponse.json(
        { error: "AI service is temporarily busy. Please wait a minute and try again." },
        { status: 429 }
      );
    }
    
    // Check for quota exceeded
    if (errorMessage.includes("quota") || errorMessage.includes("QUOTA")) {
      return NextResponse.json(
        { error: "AI service quota exceeded. Please try again later or contact support." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to extract document content: ${errorMessage}` },
      { status: 500 }
    );
  }
}
