'use client';

import React from 'react';

interface ExpenscanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export default function ExpenscanLogo({ 
  size = 'medium', 
  showText = true, 
  className = '' 
}: ExpenscanLogoProps) {
  const sizeClasses = {
    small: {
      receipt: 'w-6 h-8',
      magnifier: 'w-4 h-4',
      text: 'text-lg',
      tornEdge: 'h-1',
      lines: ['top-2 left-1 right-1 h-0.5', 'top-3.5 left-1 right-1.5 h-0.5', 'top-5 left-1 right-2 h-0.5']
    },
    medium: {
      receipt: 'w-8 h-10',
      magnifier: 'w-5 h-5',
      text: 'text-lg',
      tornEdge: 'h-1.5',
      lines: ['top-2 left-1.5 right-1.5 h-0.5', 'top-4 left-1.5 right-2 h-0.5', 'top-6 left-1.5 right-2.5 h-0.5']
    },
    large: {
      receipt: 'w-16 h-20',
      magnifier: 'w-8 h-8',
      text: 'text-4xl',
      tornEdge: 'h-3',
      lines: ['top-5 left-3 right-3 h-1', 'top-8 left-3 right-4 h-1', 'top-11 left-3 right-5 h-1']
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        {/* レシートアイコン */}
        <div className={`${currentSize.receipt} bg-gradient-to-b from-gray-100 to-gray-200 rounded-sm relative`}>
          <div className={`absolute top-0 left-0 right-0 ${currentSize.tornEdge} bg-gradient-to-r from-gray-300 to-gray-400 rounded-t-sm`}></div>
          <div className={`absolute ${currentSize.lines[0]} bg-gray-400`}></div>
          <div className={`absolute ${currentSize.lines[1]} bg-gray-400`}></div>
          <div className={`absolute ${currentSize.lines[2]} bg-gray-400`}></div>
        </div>
        {/* 虫眼鏡アイコン */}
        <div className={`absolute -bottom-0.5 -right-0.5 ${currentSize.magnifier} bg-cyan-400 rounded-full flex items-center justify-center`}>
          <div className="w-1.5 h-1.5 border-2 border-white border-t-transparent rounded-full transform rotate-45"></div>
        </div>
      </div>
      {/* ロゴテキスト */}
      {showText && (
        <div className="flex items-center">
          <span className={`${currentSize.text} font-bold text-gray-100`}>Expens</span>
          <span className={`${currentSize.text} font-bold text-cyan-400`}>can</span>
        </div>
      )}
    </div>
  );
} 
