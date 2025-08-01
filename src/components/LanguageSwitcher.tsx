'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguage, t } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLanguage?: 'ja' | 'en';
  onLanguageChange?: (language: 'ja' | 'en') => void;
}

export default function LanguageSwitcher({ currentLanguage: propCurrentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ja' | 'en'>('ja');

  useEffect(() => {
    setIsClient(true);
    setCurrentLanguage(getCurrentLanguage());
  }, []);

  const handleLanguageChange = (language: 'ja' | 'en') => {
    if (!isClient) return;

    setLanguage(language);
    setCurrentLanguage(language);
    
    if (onLanguageChange) {
      onLanguageChange(language);
    }
    
    // ページをリロードして言語変更を反映
    window.location.reload();
  };

  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-12 h-8 bg-surface-700 rounded-md animate-pulse"></div>
      </div>
    );
  }

  const displayLanguage = propCurrentLanguage || currentLanguage;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageChange('ja')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
          displayLanguage === 'ja'
            ? 'bg-primary-600 text-white'
            : 'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white'
        }`}
      >
        JA
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
          displayLanguage === 'en'
            ? 'bg-primary-600 text-white'
            : 'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
} 
