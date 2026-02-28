
export interface ResumeData {
  htmlContent: string;
  originalFileName: string;
  optimizedFileName: string;
  language: 'Arabic' | 'English' | 'Unknown';
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
