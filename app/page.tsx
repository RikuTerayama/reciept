'use client';

import React, { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import MainApp from '@/components/MainApp';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'edge';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初回訪問チェックとユーザー情報チェック
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient]);

  const handleWelcomeComplete = () => {
    console.log('Welcome screen completed');
    setShowWelcome(false);
  };

  const handleUserSetupComplete = (userData: UserInfo) => {
    console.log('User setup completed:', userData);
    setUserInfo(userData);
  };

  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return <div>Loading...</div>;
  }

  // ウェルカムスクリーンが表示されている間はメインコンテンツを非表示
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return <MainApp userInfo={userInfo} onUserSetupComplete={handleUserSetupComplete} />;
} 
