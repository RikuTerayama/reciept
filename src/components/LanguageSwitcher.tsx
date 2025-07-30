'use client';

import React from 'react';
import { getCurrentLanguage, setLanguage, t } from '@/lib/i18n';

interface LanguageSwitcherProps {
  onLanguageChange?: (language: 'ja' | 'en') => void;
}

export default function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (language: 'ja' | 'en') => {
    setLanguage(language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
    // ページをリロードして言語変更を反映
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageChange('ja')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLanguage === 'ja'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        JA
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLanguage === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  );
} 
