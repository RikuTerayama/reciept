'use client';

import React, { useState, useEffect } from 'react';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Home() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー情報チェック
  useEffect(() => {
    // タイムアウト処理を追加
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3秒後に強制的にLoadingを終了

    try {
      const savedUserInfo = localStorage.getItem('user_info');
      
      if (savedUserInfo) {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
      }
    } catch (error) {
      console.error('Failed to parse saved user info:', error);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  const handleUserSetupComplete = (userData: any) => {
    setUserInfo(userData);
  };

  // Loading中は何も表示しない（または最小限の表示）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Expenscan</div>
          <div className="text-gray-400">Loading...</div>
          <div className="mt-4">
            <button 
              onClick={() => setIsLoading(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              スキップ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ユーザー設定が完了していない場合は設定画面を表示
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Expenscan</h1>
            <p className="text-xl text-gray-400">レシート経費管理システム</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">初期設定</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email') as string,
                targetMonth: formData.get('targetMonth') as string,
                department: formData.get('department') as string,
                budget: Number(formData.get('budget'))
              };
              localStorage.setItem('user_info', JSON.stringify(userData));
              handleUserSetupComplete(userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">メールアドレス</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">対象月</label>
                  <input
                    type="month"
                    name="targetMonth"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">部署</label>
                  <input
                    type="text"
                    name="department"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="営業部"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">予算</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="100000"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  設定を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // メインアプリケーション
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Expenscan</h1>
          <p className="text-gray-400">
            ユーザー: {userInfo.email} | 部署: {userInfo.department} | 予算: ¥{userInfo.budget.toLocaleString()}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">単一アップロード</h2>
            <p className="text-gray-400 mb-4">レシート画像を1枚ずつアップロードしてOCR処理を行います。</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              アップロード
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">一括アップロード</h2>
            <p className="text-gray-400 mb-4">複数のレシート画像を一度にアップロードして処理します。</p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              一括アップロード
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">データ入力</h2>
            <p className="text-gray-400 mb-4">経費データを手動で入力・編集します。</p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              データ入力
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">経費一覧</h2>
            <p className="text-gray-400 mb-4">登録された経費データを一覧表示します。</p>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              一覧表示
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">予算最適化</h2>
            <p className="text-gray-400 mb-4">予算内で最適な経費の組み合わせを提案します。</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              最適化
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">設定</h2>
            <p className="text-gray-400 mb-4">アプリケーションの設定を変更します。</p>
            <button 
              onClick={() => {
                localStorage.removeItem('user_info');
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            アプリケーションが正常に動作しています！
          </p>
        </div>
      </div>
    </div>
  );
} 
