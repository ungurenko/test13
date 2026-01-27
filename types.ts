export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  tone: string;
  readingTime: string;
  keywords: string[];
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: AnalysisResult | null;
  error: string | null;
}

export interface AppConfig {
  systemInstruction: string;
  model: string;
  temperature: number;
  responseSchema: string; // JSON string for easier editing
}
