import { Language, ModelConfig, ModelType } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Detectar Idioma', flag: '🌐' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: 'Mandarim', flag: '🇨🇳' },
  { code: 'ja', name: 'Japonês', flag: '🇯🇵' },
  { code: 'ko', name: 'Coreano', flag: '🇰🇷' },
  { code: 'ru', name: 'Russo', flag: '🇷🇺' },
  { code: 'ar', name: 'Árabe', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export const AI_MODELS: ModelConfig[] = [
  {
    id: ModelType.GEMINI_FLASH,
    name: 'Gemini 2.5 Preview',
    description: 'Velocidade e eficiência para traduções rápidas.',
    icon: 'fa-bolt',
  },
  {
    id: ModelType.CLAUDE_SONNET,
    name: 'Claude Sonnet 4.5',
    description: 'Alta precisão e nuances culturais complexas.',
    icon: 'fa-brain',
  },
];

export const INITIAL_GREETING = "Digite, cole ou envie uma imagem/PDF para traduzir.";