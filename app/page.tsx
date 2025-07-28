'use client';

import React, { useState, useEffect } from 'react';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Home() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false); // Loadingを無効化

  // ユーザー情報チェック
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem('user_info');
      console.log('Saved user info:', savedUserInfo);
      
      if (savedUserInfo) {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
        console.log('User info set:', parsed);
      }
    } catch (error) {
      console.error('Failed to parse saved user info:', error);
    }
  }, []);

  // デバッグ用：userInfoの変化を監視
  useEffect(() => {
    console.log('userInfo changed:', userInfo);
  }, [userInfo]);

  const handleUserSetupComplete = (userData: any) => {
    console.log('handleUserSetupComplete called with:', userData);
    setUserInfo(userData);
    console.log('setUserInfo called, userInfo should be updated');
    // 強制的に再レンダリングを促す
    setTimeout(() => {
      console.log('Forcing re-render');
      window.location.reload();
    }, 100);
  };

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
              console.log('Form submitted');
              
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email') as string,
                targetMonth: formData.get('targetMonth') as string,
                department: formData.get('department') as string,
                budget: Number(formData.get('budget'))
              };
              
              console.log('Form data:', userData);
              
              // バリデーション
              if (!userData.email || !userData.targetMonth || !userData.department || userData.budget <= 0) {
                alert('すべての項目を正しく入力してください。');
                return;
              }
              
              try {
                // localStorageに保存
                localStorage.setItem('user_info', JSON.stringify(userData));
                console.log('Data saved to localStorage successfully');
                
                // React状態を直接更新
                setUserInfo(userData);
                console.log('UserInfo state updated:', userData);
                
                // 成功メッセージ（短時間で表示）
                setTimeout(() => {
                  alert('設定が保存されました。メイン画面に遷移します。');
                }, 100);
                
              } catch (error) {
                console.error('Error saving data:', error);
                alert('設定の保存中にエラーが発生しました。');
              }
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
            
            {/* デバッグ用の手動遷移ボタン */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400 mb-2">設定を保存した後、自動遷移しない場合は以下をクリックしてください</p>
              <button
                onClick={() => {
                  const savedUserInfo = localStorage.getItem('user_info');
                  if (savedUserInfo) {
                    try {
                      const parsed = JSON.parse(savedUserInfo);
                      console.log('Manual transition with saved data:', parsed);
                      setUserInfo(parsed);
                      console.log('UserInfo state updated manually');
                    } catch (error) {
                      console.error('Error parsing saved data:', error);
                      alert('保存されたデータの読み込みに失敗しました。');
                    }
                  } else {
                    alert('設定が保存されていません。先に設定を保存してください。');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                手動でメイン画面に遷移
              </button>
            </div>
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
