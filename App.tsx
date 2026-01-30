import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ModelType, Attachment, TranslationHistoryItem } from './types';
import { AI_MODELS, INITIAL_GREETING } from './constants';
import { translateContent, generateSpeech } from './services/geminiService';
import { Button } from './components/Button';
import { LanguageDropdown } from './components/LanguageDropdown';
import { HistorySidebar } from './components/HistorySidebar';
import { Logo } from './components/Logo';

// Helper functions for PCM decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Speech Recognition Types
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

function App() {
  // State
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('pt');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.GEMINI_FLASH);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('translationHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to local storage when it changes
  useEffect(() => {
    localStorage.setItem('translationHistory', JSON.stringify(history));
  }, [history]);

  // Handle Speech Recognition
  const toggleListening = () => {
    const w = window as unknown as IWindow;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sourceLang === 'auto' ? 'pt-BR' : sourceLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
           .map((result: any) => result[0].transcript)
           .join('');
        setSourceText(transcript);
      }

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return; // Cannot swap auto
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    // Also swap text if present
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if ((!sourceText.trim() && !attachment)) return;

    setIsTranslating(true);
    setTranslatedText(''); // Clear previous

    try {
      const result = await translateContent(sourceText, sourceLang, targetLang, selectedModel, attachment);
      setTranslatedText(result);

      // Add to history
      const newItem: TranslationHistoryItem = {
        id: Date.now().toString(),
        sourceText: attachment ? `[Arquivo: ${attachment.file.name}] ${sourceText}` : sourceText,
        translatedText: result,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
        model: selectedModel
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
    } catch (error) {
      console.error(error);
      setTranslatedText("Ocorreu um erro na tradução. Tente novamente.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        let type: 'image' | 'pdf' = 'image';
        if (file.type === 'application/pdf') type = 'pdf';

        setAttachment({
          file,
          base64,
          type,
          mimeType: file.type
        });
        
        if (!sourceText) {
             setSourceText("Traduzindo conteúdo do arquivo...");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
  };

  const handleSpeak = async () => {
    if (!translatedText || isPlayingAudio) return;
    setIsPlayingAudio(true);
    
    // Check if Gemini can do it (high quality), otherwise fallback
    const audioBase64 = await generateSpeech(translatedText, targetLang);
    
    if (audioBase64) {
      // Gemini TTS
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass({sampleRate: 24000});
        
        const bytes = decode(audioBase64);
        const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsPlayingAudio(false);
        source.start();
      } catch (e) {
        console.error("Audio decode error", e);
        setIsPlayingAudio(false);
      }
    } else {
        // Fallback Web Speech API
        const utterance = new SpeechSynthesisUtterance(translatedText);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(targetLang));
        if (voice) utterance.voice = voice;
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
    }
  };
  
  // Autosize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [sourceText]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="opacity-[0.03] dark:opacity-[0.05] transform scale-150 sm:scale-100 transition-opacity duration-300">
           <Logo className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px]" />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 transition-colors duration-300 border-b dark:border-gray-700 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition-opacity">
              <Logo className="w-10 h-10 drop-shadow-md" />
              <div>
                <h1 className="text-2xl font-brand font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight leading-none">
                  Tradutor Inteligente
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                  AI Translation Hub
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
               {/* Mobile Model Toggle or Desktop */}
               <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-4">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                        selectedModel === model.id 
                          ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-white shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <i className={`fas ${model.icon} mr-1.5`}></i>
                      {model.name}
                    </button>
                  ))}
               </div>

               <Button 
                  variant="ghost" 
                  onClick={toggleDarkMode}
                  className="text-gray-500 dark:text-yellow-400"
                  aria-label="Alternar Modo Escuro"
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
               </Button>

               <Button 
                  variant="ghost" 
                  onClick={() => setIsHistoryOpen(true)}
                  aria-label="Ver Histórico"
                >
                  <i className="fas fa-history text-lg"></i>
               </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Model Selector (Visible only on small screens) */}
      <div className="md:hidden px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative z-20">
         <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
             {AI_MODELS.map((model) => (
               <button
                 key={model.id}
                 onClick={() => setSelectedModel(model.id)}
                 className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold flex justify-center items-center transition-all ${
                   selectedModel === model.id 
                     ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-white shadow-sm' 
                     : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                 }`}
               >
                 <i className={`fas ${model.icon} mr-1.5`}></i>
                 {model.name}
               </button>
             ))}
         </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center relative z-10">
        
        {/* Language Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6 transition-colors">
            <LanguageDropdown 
              label="De:" 
              selectedCode={sourceLang} 
              onChange={setSourceLang} 
            />
            
            <button 
              onClick={handleSwapLanguages}
              className={`p-3 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${sourceLang === 'auto' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Inverter Idiomas"
            >
              <i className="fas fa-exchange-alt transform md:rotate-0 rotate-90"></i>
            </button>

            <LanguageDropdown 
              label="Para:" 
              selectedCode={targetLang} 
              onChange={setTargetLang} 
              excludeAuto 
            />
        </div>

        {/* Translation Area */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4 h-full md:h-auto min-h-[400px]">
          
          {/* Source Input */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 transition-all">
             <div className="p-4 flex-grow relative">
                <textarea
                  ref={textareaRef}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Digite o texto aqui..."
                  className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg text-gray-700 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 min-h-[200px]"
                  maxLength={5000}
                />
                
                {/* Attachment Preview */}
                {attachment && (
                  <div className="absolute bottom-4 left-4 right-4 bg-indigo-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between border border-indigo-100 dark:border-gray-600">
                    <div className="flex items-center text-sm text-indigo-900 dark:text-gray-200 truncate">
                      <i className={`fas ${attachment.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-image text-green-500'} mr-2 text-lg`}></i>
                      <span className="truncate max-w-[150px]">{attachment.file.name}</span>
                    </div>
                    <button onClick={clearAttachment} className="text-gray-400 hover:text-red-500">
                      <i className="fas fa-times-circle"></i>
                    </button>
                  </div>
                )}
             </div>

             {/* Action Bar */}
             <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex space-x-2">
                   {/* File Input */}
                   <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <Button 
                      variant="ghost" 
                      onClick={() => fileInputRef.current?.click()}
                      title="Anexar Imagem ou PDF"
                      className={attachment ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                    >
                      <i className="fas fa-paperclip"></i>
                    </Button>
                    
                    {/* Microphone Button */}
                    <Button
                      variant="ghost"
                      onClick={toggleListening}
                      title="Falar (Ditado)"
                      className={`${isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                    >
                      <i className={`fas ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                    </Button>

                    <div className="hidden sm:flex items-center text-xs text-gray-400 ml-2">
                      <span className="bg-gray-200 dark:bg-gray-700 px-1.5 rounded mr-1">PDF</span>
                      <span className="bg-gray-200 dark:bg-gray-700 px-1.5 rounded">IMG</span>
                    </div>
                </div>
                
                <div className="flex items-center">
                   <span className="text-xs text-gray-400 mr-3 hidden sm:block">
                     {sourceText.length}/5000
                   </span>
                   <Button onClick={handleTranslate} loading={isTranslating} disabled={!sourceText && !attachment}>
                     Traduzir
                   </Button>
                </div>
             </div>
          </div>

          {/* Result Output */}
          <div className="bg-indigo-900 dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-800 dark:border-gray-700 flex flex-col overflow-hidden text-white relative transition-colors">
             
             {isTranslating && (
               <div className="absolute inset-0 bg-indigo-900 dark:bg-gray-800 z-10 flex flex-col items-center justify-center opacity-90">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                 <p className="text-indigo-200 animate-pulse text-sm">
                   {selectedModel === ModelType.CLAUDE_SONNET ? 'Analisando nuances...' : 'Traduzindo...'}
                 </p>
               </div>
             )}

             <div className="p-6 flex-grow flex flex-col">
                {!translatedText ? (
                  <div className="flex-grow flex items-center justify-center text-indigo-400 dark:text-gray-600 opacity-50 flex-col">
                     <i className="fas fa-language text-4xl mb-2"></i>
                     <p>A tradução aparecerá aqui</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                     <p className="text-lg leading-relaxed whitespace-pre-line text-white dark:text-gray-100">{translatedText}</p>
                  </div>
                )}
             </div>

             {/* Result Actions */}
             {translatedText && (
               <div className="bg-indigo-950 dark:bg-gray-900 px-4 py-3 border-t border-indigo-800 dark:border-gray-700 flex justify-end items-center space-x-2">
                  <Button variant="ghost" onClick={handleSpeak} className="text-indigo-200 hover:text-white hover:bg-indigo-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <i className={`fas ${isPlayingAudio ? 'fa-stop-circle text-red-400' : 'fa-volume-up'}`}></i>
                  </Button>
                  <Button variant="ghost" onClick={handleCopy} className="text-indigo-200 hover:text-white hover:bg-indigo-800 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                    <i className="fas fa-copy"></i>
                  </Button>
               </div>
             )}
          </div>

        </div>

        {/* Features / Marketing (if empty state) */}
        {!sourceText && !attachment && (
           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl opacity-80">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 text-xl">
                   <i className="fas fa-robot"></i>
                 </div>
                 <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">IA Híbrida</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Alterne entre a velocidade do Gemini Flash e a precisão do Claude Sonnet.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 text-xl">
                   <i className="fas fa-file-pdf"></i>
                 </div>
                 <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Docs & Imagens</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Traduza contratos em PDF ou cardápios em fotos mantendo o contexto.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-4 text-xl">
                   <i className="fas fa-globe-americas"></i>
                 </div>
                 <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Contexto Real</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Traduções que entendem gírias, expressões e nuances culturais.</p>
              </div>
           </div>
        )}

      </main>

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelect={(item) => {
           setSourceLang(item.sourceLang);
           setTargetLang(item.targetLang);
           // Remove [Arquivo] prefix if present for display in text box
           setSourceText(item.sourceText.replace(/^\[Arquivo:.*?\]\s*/, ''));
           setTranslatedText(item.translatedText);
           setAttachment(null); // Simple logic: don't reload file blob from history
        }}
      />

    </div>
  );
}

export default App;