
import { GoogleGenAI } from "@google/genai";

// Fix: Recommended pattern is to create a new instance before each call to ensure latest configuration.
export const explainMedicalRequest = async (request: {
  requester: string;
  purpose: string;
  fields: string[];
}) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain in simple, empathetic terms to a patient why ${request.requester} is asking for their ${request.fields.join(', ')} for the purpose of "${request.purpose}". Highlight the privacy benefits of sharing only these specific data points instead of their whole medical history.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
        // Fix: According to guidelines, both maxOutputTokens and thinkingBudget must be set together.
        thinkingConfig: { thinkingBudget: 100 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "XNAMEX is currently unable to generate an AI explanation, but you can still review the request details below.";
  }
};

export const analyzeHealthInsight = async (records: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these mock medical record types: ${records.map(r => r.type).join(', ')}, explain to a patient what a "health profile" summary looks like in XNAMEX and how it helps them stay in control of their data. Keep it brief and encouraging.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Your data is securely encrypted in your vault.";
    }
};
