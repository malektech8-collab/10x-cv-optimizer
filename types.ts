
export interface ResumeData {
  htmlContent: string;
  originalFileName: string;
  optimizedFileName: string;
  language: 'Arabic' | 'English' | 'Unknown';
}

export type TemplateType = 'classic' | 'modern' | 'executive';

export interface ResumeJsonData {
  contact: {
    name: string;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    website?: string | null;
  };
  summary?: string | null;
  workExperience?: {
    jobTitle: string;
    company: string;
    dateRange: string;
    location?: string | null;
    bullets: string[];
  }[] | null;
  education?: {
    degree: string;
    institution: string;
    dateRange?: string | null;
    gpa?: string | null;
    honors?: string | null;
  }[] | null;
  skills?: string[] | null;
  certifications?: { name: string; issuer?: string | null; date?: string | null }[] | null;
  languages?: string[] | null;
  additionalSections?: { heading: string; content: string[] }[] | null;
}

export interface AnalysisReport {
  score: number;
  grammarIssues: string[];
  structureGaps: string[];
  atsCompatibility: string;
  impactOptimizations: string[];
  summary: string;
  // Deterministic ATS breakdown (populated when deterministicATS flag is on)
  scoreBreakdown?: {
    formatting: number;
    keywords: number;
    impact: number;
    structure: number;
  };
  issues?: string[];
  strengths?: string[];
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
