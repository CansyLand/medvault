import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ParsedRecord {
  title: string;
  content: string;
  summary: string;
  date: string | null;
  provider: string | null;
  type: string;
}

function parseRecordValue(value: string): ParsedRecord | null {
  try {
    const parsed = JSON.parse(value);
    return {
      title: parsed.title || "Unknown Document",
      content: parsed.content || "",
      summary: parsed.summary || "",
      date: parsed.date || null,
      provider: parsed.provider || null,
      type: parsed.type || "document",
    };
  } catch {
    return null;
  }
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
    const { message, records, chatHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        response: "I don't see any documents uploaded yet. Please upload some medical documents first so I can help answer questions about them."
      });
    }

    // Parse the serialized record values to extract actual content
    const parsedRecords = records
      .map((doc: { key: string; value: string }) => {
        const parsed = parseRecordValue(doc.value);
        return parsed ? { key: doc.key, ...parsed } : null;
      })
      .filter((r: ParsedRecord | null): r is ParsedRecord & { key: string } => r !== null);

    if (parsedRecords.length === 0) {
      return NextResponse.json({
        response: "I couldn't read your documents. Please try uploading them again."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Phase 1: Determine which documents are relevant
    const documentSummaries = parsedRecords.map((doc, index: number) => ({
      index,
      title: doc.title,
      summary: doc.summary,
      type: doc.type,
    }));

    const relevancePrompt = `Given the user's question: "${message}"

Here are the available medical records:
${documentSummaries
  .map((doc) => `Document ${doc.index + 1}: "${doc.title}" (${doc.type})\nSummary: ${doc.summary}`)
  .join("\n\n")}

Please analyze which documents are most relevant to answer this question. Return only a JSON array of document indices (0-based) that should be included for context. If the question is general or could apply to multiple documents, include all relevant ones.

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
      relevantIndices = relevantIndices.filter(
        (i) => Number.isInteger(i) && i >= 0 && i < parsedRecords.length
      );
    } catch {
      // If parsing fails, use all documents
      relevantIndices = parsedRecords.map((_, i: number) => i);
    }

    // If no specific documents found relevant, use all of them for general questions
    if (relevantIndices.length === 0) {
      relevantIndices = parsedRecords.map((_, i: number) => i);
    }

    // Phase 2: Answer the question with relevant document content
    const contextDocs = relevantIndices.map((index: number) => parsedRecords[index]);

    const historyContext = chatHistory && chatHistory.length > 0
      ? `Previous conversation:\n${chatHistory.map((msg: { role: string; content: string }) => 
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        ).join("\n")}\n\n`
      : "";

    const contextPrompt = `You are a helpful AI assistant answering questions about the user's medical documents stored in their encrypted personal health vault. Be concise, accurate, and helpful.

The user has uploaded the following medical documents:
${contextDocs
  .map((doc, i: number) => `
--- Document ${i + 1}: ${doc.title} ---
Type: ${doc.type}
Date: ${doc.date || "Not specified"}
Provider: ${doc.provider || "Not specified"}
Summary: ${doc.summary}
Full Content: ${doc.content}
`)
  .join("\n")}

${historyContext}User's question: ${message}

Please provide a helpful, accurate answer based on the document content above. Reference specific information from the documents when possible. If the question cannot be answered from the available documents, say so clearly.`;

    const answerResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contextPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return NextResponse.json({
      response: answerResponse.text?.trim() || "I couldn't generate a response. Please try again."
    });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
