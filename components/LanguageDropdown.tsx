import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageDropdownProps {
  selectedCode: string;
  onChange: (code: string) => void;
  excludeAuto?: boolean;
  label?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ selectedCode, onChange, excludeAuto = false, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedCode) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = excludeAuto 
    ? SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto')
    : SUPPORTED_LANGUAGES;

  return (
    <div className="relative w-full md:w-48" ref={dropdownRef}>
      {label && <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 px-4 py-2.5 rounded-xl shadow-sm transition-all"
      >
        <span className="flex items-center text-gray-700 dark:text-gray-200">
            <span className="mr-2 text-lg">{selectedLang.flag}</span>
            <span className="font-medium">{selectedLang.name}</span>
        </span>
        <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto scrollbar-thin">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChange(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedCode === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}
            >
               <span className="mr-3 text-lg">{lang.flag}</span>
               <span className="text-sm font-medium">{lang.name}</span>
               {selectedCode === lang.code && <i className="fas fa-check ml-auto text-indigo-600 dark:text-indigo-400 text-xs"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};