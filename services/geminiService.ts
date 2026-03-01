import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { AnalysisReport } from "../types";

export const analyzeResume = async (fileBase64: string, mimeType: string, targetLang: 'en' | 'ar'): Promise<AnalysisReport> => {
  try {
    const analyzeFunction = httpsCallable(functions, 'analyzeResume');
    const result = await analyzeFunction({ fileBase64, mimeType, targetLang });
    return result.data as AnalysisReport;
  } catch (error: any) {
    console.error("Firebase Function Error (Analysis):", error);
    throw new Error(error.message || "Failed to analyze the resume. Please try again.");
  }
};

export const optimizeResume = async (fileBase64: string, mimeType: string, targetLang: 'en' | 'ar', userComments?: string, optimizationId?: string): Promise<string> => {
  try {
    const optimizeFunction = httpsCallable(functions, 'optimizeResume');
    const result = await optimizeFunction({ fileBase64, mimeType, targetLang, userComments, optimizationId });
    return (result.data as any).html as string;
  } catch (error: any) {
    console.error("Firebase Function Error (Optimization):", error);
    throw new Error(error.message || "Failed to process the resume. Please try again.");
  }
};

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
