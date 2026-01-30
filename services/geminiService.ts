import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { ModelType, Attachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Maps the UI model selection to the actual Gemini model ID.
 * Since we don't have a Claude API key in this environment, we use Gemini 3 Pro
 * to represent the "High Intelligence" option and Gemini 2.5 Flash for the "Fast" option.
 */
const getActualModelId = (uiModel: ModelType): string => {
  switch (uiModel) {
    case ModelType.CLAUDE_SONNET:
      return 'gemini-3-pro-preview'; // Simulating high-end reasoning
    case ModelType.GEMINI_FLASH:
    default:
      // Using Flash Lite or Flash for speed as requested
      return 'gemini-flash-lite-latest';
  }
};

export const translateContent = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  modelType: ModelType,
  attachment: Attachment | null
): Promise<string> => {
  try {
    const actualModel = getActualModelId(modelType);
    
    let prompt = `You are a professional translator. Translate the content from ${sourceLang === 'auto' ? 'the detected language' : sourceLang} to ${targetLang}. 
    Ensure the translation is natural, culturally relevant, and preserves the original formatting and tone. 
    Do not add explanations, just provide the translation.`;

    if (attachment && attachment.type === 'pdf') {
        prompt += " The user has attached a PDF. Translate the textual content of the PDF provided.";
    } else if (attachment && attachment.type === 'image') {
        prompt += " The user has attached an image. Translate the text found within the image.";
    }

    if (text) {
        prompt += `\n\nOriginal Text:\n${text}`;
    }

    const parts: any[] = [{ text: prompt }];

    if (attachment) {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = attachment.base64.split(',')[1];
      
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: base64Data,
        },
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: actualModel,
      contents: {
        parts: parts
      }
    });

    return response.text || "Não foi possível gerar a tradução.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Erro ao realizar a tradução. Verifique sua chave de API ou tente novamente.";
  }
};

export const generateSpeech = async (text: string, targetLangCode: string): Promise<string | null> => {
  try {
    // Basic mapping for TTS voices if needed, or let the model decide based on text
    // Using gemini-2.5-flash-preview-tts for speech generation
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
            parts: [{ text: text }]
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: 'Puck' // Generic pleasant voice
                    }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}