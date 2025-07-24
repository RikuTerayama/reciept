'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Sparkles } from 'lucide-react';
import { t } from '@/lib/i18n';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [iconVisible, setIconVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    // アニメーションの順序制御
    const timer1 = setTimeout(() => setTextVisible(true), 300);
    const timer2 = setTimeout(() => setIconVisible(true), 800);
    const timer3 = setTimeout(() => setSubtitleVisible(true), 1200);
    const timer4 = setTimeout(() => setFooterVisible(true), 1600);
    const timer5 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // フェードアウト後にコールバック実行
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* 背景のパーティクルエフェクト */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.7,
            }}
          />
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center space-y-8 flex-1 flex flex-col items-center justify-center">
        {/* Welcome テキスト */}
        <div
          className={`transition-all duration-1000 ease-out ${
            textVisible
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-8'
          }`}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wider">
            {t('welcome.title')}
          </h1>
        </div>

        {/* アイコン */}
        <div
          className={`transition-all duration-1000 ease-out delay-300 ${
            iconVisible
              ? 'opacity-100 transform scale-100'
              : 'opacity-0 transform scale-75'
          }`}
        >
          <div className="relative">
            <div className="p-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-2xl neon-glow">
              <Receipt className="w-16 h-16 text-white" />
            </div>
            {/* スパークルエフェクト */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* サブタイトル */}
        <div
          className={`transition-all duration-1000 ease-out delay-500 ${
            subtitleVisible
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-4'
          }`}
        >
          <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
            {t('welcome.subtitle')}
          </p>
          <p className="text-sm md:text-base text-gray-400 mt-2 font-light">
            {t('welcome.description')}
          </p>
        </div>

        {/* ローディングインジケーター */}
        <div className="flex justify-center mt-12">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="relative z-10 pb-8">
        <div
          className={`transition-all duration-1000 ease-out delay-700 ${
            footerVisible
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-4'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-lg neon-glow">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Expenscan
              </h2>
              <p className="text-xs text-gray-400">
                レシート経費管理システム
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* フェードアウトオーバーレイ */}
      {!isVisible && (
        <div className="absolute inset-0 bg-black transition-opacity duration-500 opacity-100" />
      )}
    </div>
  );
} 
