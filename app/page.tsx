'use client';

import React, { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import MainApp from '@/components/MainApp';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 初回訪問チェックとユーザー情報チェック
  useEffect(() => {
    const hasVisited = localStorage.getItem('receipt_expense_manager_visited');
    const savedUserInfo = localStorage.getItem('user_info');
    
    console.log('Initial load - hasVisited:', hasVisited, 'savedUserInfo:', savedUserInfo);
    
    if (hasVisited) {
      console.log('User has visited before, skipping welcome screen');
      setShowWelcome(false);
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo);
          console.log('Parsed user info:', parsed);
          setUserInfo(parsed);
        } catch (error) {
          console.error('Failed to parse saved user info:', error);
        }
      }
    } else {
      console.log('First visit, showing welcome screen');
      localStorage.setItem('receipt_expense_manager_visited', 'true');
    }
  }, []);

  const handleWelcomeComplete = () => {
    console.log('Welcome screen completed');
    setShowWelcome(false);
  };

  const handleUserSetupComplete = (userData: UserInfo) => {
    console.log('User setup completed:', userData);
    setUserInfo(userData);
  };

  // ウェルカムスクリーンが表示されている間はメインコンテンツを非表示
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return <MainApp userInfo={userInfo} onUserSetupComplete={handleUserSetupComplete} />;
} 
