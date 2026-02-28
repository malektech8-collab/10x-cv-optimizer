
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an Expert Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

OBJECTIVE
Rewrite the provided resume into a high-impact, ATS-optimized, professional resume.
1. Easy for ATS software to parse.
2. Compelling for recruiters.
3. Structured, concise, and results-driven.

You must rewrite the content completely, enhancing bullet points with action verbs and quantifiable results.

LANGUAGE RULE
- Detect if the input is Arabic or English.
- Output the resume in the SAME language as the input.
- If Arabic, use professional Modern Standard Arabic. Do not mix languages.

OUTPUT FORMAT — STRICT HTML ONLY
- Return ONLY valid HTML.
- DO NOT use markdown code fences (like \`\`\`html).
- DO NOT provide any introductory or concluding text.
- Start directly with <!DOCTYPE html>.

HTML STRUCTURE
- Use <!DOCTYPE html><html><head><title>Resume</title></head><body style="margin: 0.5in; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333;">...</body></html>
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

export const optimizeResume = async (fileBase64: string, mimeType: string): Promise<string> => {
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
              text: "Please rewrite this resume. Follow the ATS optimization instructions perfectly. Ensure the output is valid HTML and contains all the professional sections.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
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
