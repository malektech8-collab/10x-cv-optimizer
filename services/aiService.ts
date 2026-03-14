import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { AnalysisReport, ResumeJsonData } from "../types";

/**
 * Analyze a resume: extracts text, parses to JSON (Claude), runs ATS diagnostics (Gemini).
 * Returns the analysis report + a sessionId to pass to optimizeResume.
 */
export const analyzeResume = async (
  fileBase64: string,
  mimeType: string,
  targetLang: 'en' | 'ar'
): Promise<{ report: AnalysisReport; sessionId: string; parsedJson?: ResumeJsonData }> => {
  try {
    const analyzeFunction = httpsCallable(functions, 'analyzeResume', { timeout: 180_000 });
    const result = await analyzeFunction({ fileBase64, mimeType, targetLang });
    const data = result.data as { report: AnalysisReport; sessionId: string; parsedJson?: ResumeJsonData };
    return data;
  } catch (error: any) {
    console.error("Firebase Function Error (Analysis):", error);
    throw new Error(error.message || "Failed to analyze the resume. Please try again.");
  }
};

/**
 * Optimize a resume: Claude Sonnet rewrites the parsed JSON from the parse session.
 * Requires the sessionId from analyzeResume.
 */
export const optimizeResume = async (
  sessionId: string,
  targetLang: 'en' | 'ar',
  userComments?: string,
  optimizationId?: string,
  jobTarget?: { jobTitle?: string; industry?: string; jobDescription?: string },
): Promise<{ resumeData: ResumeJsonData; atsValidation?: any; coverLetter?: any; linkedinGuide?: any }> => {
  try {
    const optimizeFunction = httpsCallable(functions, 'optimizeResume', { timeout: 300_000 });
    const result = await optimizeFunction({
      sessionId, targetLang, userComments, optimizationId,
      ...jobTarget,
    });
    const data = result.data as any;
    return {
      resumeData: data.resumeData as ResumeJsonData,
      atsValidation: data.atsValidation,
      coverLetter: data.coverLetter,
      linkedinGuide: data.linkedinGuide,
    };
  } catch (error: any) {
    console.error("Firebase Function Error (Optimization):", error);
    throw new Error(error.message || "Failed to process the resume. Please try again.");
  }
};

/**
 * Create a resume session from AI Resume Builder interview data.
 * Returns a sessionId that can be passed to optimizeResume.
 */
export const createResumeSession = async (
  resumeData: ResumeJsonData,
  targetLang: 'en' | 'ar'
): Promise<{ sessionId: string }> => {
  try {
    const fn = httpsCallable(functions, 'createResumeSession');
    const result = await fn({ resumeData, targetLang });
    return result.data as { sessionId: string };
  } catch (error: any) {
    console.error("Firebase Function Error (createResumeSession):", error);
    throw new Error(error.message || "Failed to create resume session.");
  }
};

/**
 * Career consultant chatbot (GPT-4o).
 */
export const chatWithConsultant = async (
  messages: { role: 'user' | 'model'; text: string }[],
  targetLang: 'en' | 'ar'
): Promise<string> => {
  try {
    const chatFunction = httpsCallable(functions, 'chatWithConsultant');
    const result = await chatFunction({ messages, targetLang });
    return (result.data as any).text as string;
  } catch (error: any) {
    console.error("Firebase Function Chat Error:", error);
    throw new Error(error.message || "Failed to get a response from the career consultant.");
  }
};
