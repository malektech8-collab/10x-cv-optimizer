"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithConsultant = exports.optimizeResume = exports.analyzeResume = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
admin.initializeApp();
// Use process.env for local .env or Firebase functions config
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ANALYSIS_SYSTEM_INSTRUCTION = (targetLang) => `You are an Expert Resume Analyst and ATS Specialist.
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
exports.analyzeResume = functions.https.onCall({ cors: true }, async (request) => {
    const { fileBase64, mimeType, targetLang } = request.data;
    if (!fileBase64 || !mimeType || !targetLang) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments');
    }
    const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                responseMimeType: "application/json",
            },
        });
        let text = response.text || "";
        if (text.includes('```')) {
            text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        }
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Gemini API Error (Analysis):", error);
        throw new functions.https.HttpsError('internal', error.message || 'Analysis failed');
    }
});
const OPTIMIZE_SYSTEM_INSTRUCTION = (targetLang) => `You are an Expert Resume Writer and ATS (Applicant Tracking System) Optimization Specialist.

OBJECTIVE
Rewrite the provided resume into a high-impact, ATS-optimized, professional resume.
1. Easy for ATS software to parse.
2. Compelling for recruiters.
7. Best Practices 2026: Use standard fonts, single-column layout, simple bullet points, strongly quantify achievements (e.g., 'Increased sales by 15%'), use action verbs, naturally embed exact keywords from job description. No complex formatting.

You must rewrite the content completely, enhancing bullet points with action verbs and quantifiable results.

USER PREFERENCE OVERRIDE (MANDATORY)
- If the user provides specific "Comments" or "Custom Instructions", you ABSOLUTELY MUST prioritize them over other general instructions. This includes requests to change tone, hide certain information, or focus on a specific career path.

LANGUAGE RULE
- You MUST output the ENTIRE optimized resume content in ${targetLang === 'ar' ? 'professional Modern Standard Arabic' : 'English'}.
- Do not mix languages unless strictly necessary for names or technical terms.

OUTPUT FORMAT — STRICT HTML ONLY
- Return ONLY valid HTML.
- DO NOT use markdown code fences (like \`\`\`html).
- DO NOT provide any introductory or concluding text.
- Start directly with <!DOCTYPE html>.

HTML STRUCTURE
- Use <!DOCTYPE html><html dir="${targetLang === 'ar' ? 'rtl' : 'ltr'}"><head><title>Resume</title><style>@page { size: letter; margin: 0; } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; margin: 0 auto; padding: 0.5in; max-width: 8.5in; word-wrap: break-word; overflow-wrap: break-word; ${targetLang === 'ar' ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'} } h1 { color: #4D2B8C; margin-top: 0; } h2 { color: #4D2B8C; border-bottom: 1px solid #eee; padding-bottom: 4px; } h3 { font-weight: bold; margin-bottom: 2px; } p, ul { margin-top: 4px; }</style></head><body>...</body></html>
- Use <h1> for the name.
- Use <h2> for section headings (e.g., Professional Summary, Work Experience, Education, Skills).
- Use <h3> for Job Titles and Company names.
- Use <ul> and <li> for simple bullet points. Avoid decorative symbols.
- Use <p> for contact info and descriptions.
- DO NOT use external stylesheets or inline styles (rely on the <style> block above).

CONTENT RULES
- ❌ No hallucinations. Use only provided info.
- ❌ No tables, columns, text boxes, or graphics.
- ❌ No icons or photos.
- ❌ No keyword stuffing. Integrate keywords naturally.
- Ensure the header includes Name, Phone, Email, LinkedIn, and Location if available.`;
exports.optimizeResume = functions.https.onCall({ cors: true }, async (request) => {
    // Only allow logged in users (Temporarily disabled for testing/free usage)
    /*
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to optimize.');
    }
    */
    var _a, _b;
    const { fileBase64, mimeType, targetLang, userComments, optimizationId } = request.data;
    // Optional: Verify payment status in Firestore if optimizationId is provided
    if (optimizationId) {
        const docRef = admin.firestore().collection('optimizations').doc(optimizationId);
        const doc = await docRef.get();
        // If the user isn't logged in, or their ID doesn't match the record, deny access to the existing optimization ID
        if (!doc.exists || (request.auth && ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.user_id) !== request.auth.uid)) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to this optimization record.');
        }
        if (!((_b = doc.data()) === null || _b === void 0 ? void 0 : _b.is_paid)) {
            // Uncomment this once actual payment gateway is integrated
            // throw new functions.https.HttpsError('failed-precondition', 'Payment required before optimization.');
        }
    }
    if (!fileBase64 || !mimeType || !targetLang) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments');
    }
    const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey });
    try {
        const response = await ai.models.generateContent({
            // Using Pro for higher quality on paid tier
            model: 'gemini-2.5-pro',
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
                            text: `Please rewrite this resume. Follow the ATS optimization instructions perfectly. Ensure the output is valid HTML and contains all the professional sections.\n\n${userComments ? `\n\n=====================\nCRITICAL USER INSTRUCTIONS:\nThe user explicitly requested the following changes. You MUST apply them:\n"${userComments}"\n=====================\n\n` : ''}`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: OPTIMIZE_SYSTEM_INSTRUCTION(targetLang),
                temperature: 0.1,
            },
        });
        let text = response.text || "";
        if (text.includes('```')) {
            text = text.replace(/```html/g, '').replace(/```/g, '').trim();
        }
        if (!text || text.length < 50) {
            throw new Error("The AI returned an empty or insufficient response.");
        }
        return { html: text };
    }
    catch (error) {
        console.error("Gemini API Error (Optimization):", error);
        throw new functions.https.HttpsError('internal', error.message || 'Optimization failed');
    }
});
const CHATBOT_SYSTEM_INSTRUCTION = (targetLang) => `You are a Career Consultant and HR Expert.
Your primary role is to answer questions about CV building, ATS navigation, interview answers, and career advice.
Keep your responses fairly short, concise, and helpful. Do not write essays. Use formatting like bullet points when helpful.
Always respond in ${targetLang === 'ar' ? 'Arabic' : 'English'}, matching the language of the prompt.`;
exports.chatWithConsultant = functions.https.onCall({ cors: true }, async (request) => {
    const { messages, targetLang } = request.data;
    if (!messages || !Array.isArray(messages)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid messages array');
    }
    const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey });
    try {
        const formattedHistory = messages.slice(0, -1).map((msg) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        const latestMessage = messages[messages.length - 1];
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: CHATBOT_SYSTEM_INSTRUCTION(targetLang),
                temperature: 0.7,
            },
            history: formattedHistory
        });
        const response = await chat.sendMessage({ message: latestMessage.text });
        return { text: response.text || "" };
    }
    catch (error) {
        console.error("Gemini Chat API Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Chat failed');
    }
});
//# sourceMappingURL=index.js.map