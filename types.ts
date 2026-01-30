export interface Language {
  code: string;
  name: string;
  flag: string;
}

export enum ModelType {
  GEMINI_FLASH = 'gemini-flash', // Mapped to Gemini 2.5/3 Flash
  CLAUDE_SONNET = 'claude-sonnet' // Mapped to Gemini 3 Pro (simulating high-intellect model behavior)
}

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  model: ModelType;
}

export interface Attachment {
  file: File;
  base64: string;
  type: 'image' | 'pdf';
  mimeType: string;
}

export interface ModelConfig {
  id: ModelType;
  name: string;
  description: string;
  icon: string;
}