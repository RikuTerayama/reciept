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
      image: 'h-6 w-auto',
      text: 'text-lg'
    },
    medium: {
      image: 'h-8 w-auto',
      text: 'text-lg'
    },
    large: {
      image: 'h-12 w-auto',
      text: 'text-4xl'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src="/Expenscan_new_logo.png" 
        alt="Expenscan Logo" 
        className={`${currentSize.image} object-contain`}
      />
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
