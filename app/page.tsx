'use client';

import React, { useState, useEffect } from 'react';

export default function MainApp() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 初期化処理
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem('user_info');
      console.log('Main app - Saved user info:', savedUserInfo);
      
      if (savedUserInfo) {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
        console.log('Main app - User info set:', parsed);
      } else {
        // ユーザー情報がない場合は設定ページにリダイレクト
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to parse saved user info:', error);
      window.location.href = '/';
    }
  }, []);

  const handleSettingsSave = (userData: any) => {
    console.log('Settings saved:', userData);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUserInfo(userData);
    setShowSettingsModal(false);
  };

  // ユーザー情報がない場合はローディング表示
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Expenscan</h1>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Expenscan</h1>
          <div className="text-sm text-gray-300">
            ユーザー: {userInfo.email} | 部署: {userInfo.department} | 予算: ¥{userInfo.budget.toLocaleString()}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              設定変更
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('user_info');
                window.location.href = '/';
              }}
              className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

      {/* 設定モーダル */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">設定変更</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email') as string,
                targetMonth: formData.get('targetMonth') as string,
                department: formData.get('department') as string,
                budget: Number(formData.get('budget'))
              };
              
              if (!userData.email || !userData.targetMonth || !userData.department || userData.budget <= 0) {
                alert('すべての項目を正しく入力してください。');
                return;
              }
              
              handleSettingsSave(userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">メールアドレス</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={userInfo.email}
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
                    defaultValue={userInfo.targetMonth}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">部署</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={userInfo.department}
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
                    defaultValue={userInfo.budget}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="100000"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
