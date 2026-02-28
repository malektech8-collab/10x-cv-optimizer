
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisReport } from "../types";

const ANALYSIS_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are an Expert Resume Analyst and ATS Specialist.
Analyze the provided resume and return a JSON object with the following structure:
{
  "score": number (0-100),
  "grammarIssues": string[] (max 3, specific examples),
  "structureGaps": string[] (max 3, e.g., missing contact info, poor formatting),
  "atsCompatibility": "Low" | "Medium" | "High",
  "impactOptimizations": string[] (max 3, e.g., "Use action verbs", "Quantify results"),
  "summary": string (A short, compelling call to action explaining why optimizing this resume will land them more interviews)
}

IMPORTANT: Provide ALL the JSON values (strings and arrays) entirely in ${targetLang === 'ar' ? 'Arabic (Modern Standard Arabic)' : 'English'}, but KEEP the JSON keys exactly as shown above. Respond ONLY with valid JSON. Do not include markdown fences like \`\`\`json.`;

export const analyzeResume = async (fileBase64: string, mimeType: string, targetLang: 'en' | 'ar'): Promise<AnalysisReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              },
            },
            {
              text: "Please analyze this resume and provide the analysis report in JSON.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION(targetLang),
        temperature: 0.1,
      },
    });

    let text = response.text || "";

    if (text.includes('```')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    return JSON.parse(text) as AnalysisReport;
  } catch (error: any) {
    console.error("Gemini API Error (Analysis):", error);
    throw new Error(error.message || "Failed to analyze the resume. Please try again.");
  }
};
const OPTIMIZE_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are an Expert Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

OBJECTIVE
Rewrite the provided resume into a high-impact, ATS-optimized, professional resume.
1. Easy for ATS software to parse.
2. Compelling for recruiters.
3. Structured, concise, and results-driven.

You must rewrite the content completely, enhancing bullet points with action verbs and quantifiable results.

LANGUAGE RULE
- You MUST output the ENTIRE optimized resume content in ${targetLang === 'ar' ? 'professional Modern Standard Arabic' : 'English'}.
- Do not mix languages unless strictly necessary for names or technical terms.

OUTPUT FORMAT — STRICT HTML ONLY
- Return ONLY valid HTML.
- DO NOT use markdown code fences (like \`\`\`html).
- DO NOT provide any introductory or concluding text.
- Start directly with <!DOCTYPE html>.

HTML STRUCTURE
- Use <!DOCTYPE html><html dir="${targetLang === 'ar' ? 'rtl' : 'ltr'}"><head><title>Resume</title></head><body style="margin: 0.5in; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; text-align: ${targetLang === 'ar' ? 'right' : 'left'};">...</body></html>
- Use <h1> for the name (Color: #4D2B8C).
- Use <h2> for section headings (Summary, Experience, Education, Skills) (Color: #4D2B8C, Border bottom: 1px solid #eee).
- Use <h3> for Job Titles and Company names (Bold).
- Use <ul> and <li> for bullet points.
- Use <p> for contact info and descriptions.
- DO NOT use CSS classes, IDs, or external stylesheets. Only basic inline styles on the elements for colors and layout.

CONTENT RULES
- ❌ No hallucinations. Use only provided info.
- ❌ No tables or columns.
- ❌ No icons or images.
- Ensure the header includes Name, Phone, Email, LinkedIn, and Location if available.`;

export const optimizeResume = async (fileBase64: string, mimeType: string, targetLang: 'en' | 'ar', userComments?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `Please rewrite this resume. Follow the ATS optimization instructions perfectly. Ensure the output is valid HTML and contains all the professional sections.${userComments ? `\n\nUSER COMMENTS & CUSTOM INSTRUCTIONS (MANDATORY TO CONSIDER):\n${userComments}` : ''}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: OPTIMIZE_SYSTEM_INSTRUCTION(targetLang),
        temperature: 0.1, // Very low for consistency
      },
    });

    let text = response.text || "";

    // Fallback: Strip markdown fences if the model ignored the instruction
    if (text.includes('```')) {
      text = text.replace(/```html/g, '').replace(/```/g, '').trim();
    }

    if (!text || text.length < 50) {
      throw new Error("The AI returned an empty or insufficient response. Please ensure the uploaded file is a clear resume.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to process the resume. Please try again.");
  }
};

const CHATBOT_SYSTEM_INSTRUCTION = (targetLang: 'en' | 'ar') => `You are a Career Consultant and HR Expert.
Your primary role is to answer questions about CV building, ATS navigation, interview answers, and career advice.
Keep your responses fairly short, concise, and helpful. Do not write essays. Use formatting like bullet points when helpful.
Always respond in ${targetLang === 'ar' ? 'Arabic' : 'English'}, matching the language of the prompt.`;

export const chatWithConsultant = async (
  messages: { role: 'user' | 'model'; text: string }[],
  targetLang: 'en' | 'ar'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));
    const latestMessage = messages[messages.length - 1];

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: CHATBOT_SYSTEM_INSTRUCTION(targetLang),
        temperature: 0.7,
      },
      history: formattedHistory as any
    });

    const response = await chat.sendMessage({ message: latestMessage.text });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    throw new Error(error.message || "Failed to get a response from the career consultant.");
  }
};
