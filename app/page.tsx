'use client';

import React, { useState, useEffect } from 'react';
import MainApp from '@/components/MainApp';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ユーザー情報チェック
  useEffect(() => {
    if (!isClient) return;

    const savedUserInfo = localStorage.getItem('user_info');
    
    if (savedUserInfo) {
      try {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
      } catch (error) {
        console.error('Failed to parse saved user info:', error);
      }
    }
  }, [isClient]);

  const handleUserSetupComplete = (userData: UserInfo) => {
    setUserInfo(userData);
  };

  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // 直接メインアプリケーションを表示
  return <MainApp userInfo={userInfo} onUserSetupComplete={handleUserSetupComplete} />;
} 
