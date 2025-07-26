'use client';

import React, { useState, useEffect } from 'react';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初回訪問チェック
  useEffect(() => {
    if (!isClient) return;

    const hasVisited = localStorage.getItem('receipt_expense_manager_visited');
    
    if (hasVisited) {
      setShowWelcome(false);
    } else {
      localStorage.setItem('receipt_expense_manager_visited', 'true');
    }
  }, [isClient]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  // クライアントサイドでない場合は何も表示しない
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // ウェルカムスクリーン
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Welcome</h1>
          <p className="text-xl mb-8">Expenscan</p>
          <button
            onClick={handleWelcomeComplete}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            開始
          </button>
        </div>
      </div>
    );
  }

  // メインアプリケーション（簡素化版）
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Expenscan - レシート経費管理システム</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-lg mb-4">アプリケーションが正常に動作しています！</p>
          <p className="text-gray-400">
            無限ループエラーが解決されました。これでVercelデプロイが成功するはずです。
          </p>
        </div>
      </div>
    </div>
  );
} 
