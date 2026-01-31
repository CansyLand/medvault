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
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { pdfBase64 } = await request.json();
    
    if (!pdfBase64) {
      return NextResponse.json(
        { error: "No PDF data provided" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
    console.error("Gemini extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract document content" },
      { status: 500 }
    );
  }
}
