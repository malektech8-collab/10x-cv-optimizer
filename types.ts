
export interface ResumeData {
  htmlContent: string;
  originalFileName: string;
  optimizedFileName: string;
  language: 'Arabic' | 'English' | 'Unknown';
}

export interface AnalysisReport {
  score: number;
  grammarIssues: string[];
  structureGaps: string[];
  atsCompatibility: string;
  impactOptimizations: string[];
  summary: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  ANALYSIS_COMPLETED = 'ANALYSIS_COMPLETED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
