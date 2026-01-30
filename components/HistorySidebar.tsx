import React from 'react';
import { TranslationHistoryItem, ModelType } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranslationHistoryItem[];
  onSelect: (item: TranslationHistoryItem) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            <i className="fas fa-history mr-2 text-indigo-600 dark:text-indigo-400"></i>
            Histórico
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-3 scrollbar-thin">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
              <i className="fas fa-clock text-4xl mb-3 opacity-30"></i>
              <p>Nenhuma tradução recente.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { onSelect(item); onClose(); }}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-200 dark:hover:border-gray-600 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="uppercase font-bold tracking-wider">{item.sourceLang} &rarr; {item.targetLang}</span>
                    <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                      {item.model === ModelType.GEMINI_FLASH ? 'Gemini' : 'Claude'}
                    </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate mb-1">{item.sourceText}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.translatedText}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};