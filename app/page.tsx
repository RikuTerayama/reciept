'use client';

import React, { useState, useEffect } from 'react';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Home() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showDataInputModal, setShowDataInputModal] = useState(false);
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    department: '',
    budget: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // 初期化処理
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // デバッグ用：userInfoの変化を監視
  useEffect(() => {
    console.log('userInfo changed:', userInfo);
    console.log('Current userInfo state:', userInfo);
  }, [userInfo]);

  const handleSettingsSave = (userData: any) => {
    console.log('Settings saved:', userData);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUserInfo(userData);
    setShowSettingsModal(false);
  };

  // フォームデータの更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 設定保存ボタンクリック
  const handleSaveSettings = () => {
    console.log('Save settings clicked');
    console.log('Form data:', formData);
    
    // バリデーション
    if (!formData.email || !formData.targetMonth || !formData.department || !formData.budget || Number(formData.budget) <= 0) {
      alert('すべての項目を正しく入力してください。');
      return;
    }
    
    const userData = {
      email: formData.email,
      targetMonth: formData.targetMonth,
      department: formData.department,
      budget: Number(formData.budget)
    };
    
    try {
      console.log('Saving user data:', userData);
      
      // localStorageに保存
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      // 状態を更新
      setUserInfo(userData);
      
      console.log('UserInfo state updated to:', userData);
      
      // 成功メッセージ
      alert('設定が保存されました。メインアプリが表示されます。');
      
      console.log('Settings saved successfully');
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('設定の保存中にエラーが発生しました。');
    }
  };

  // ボタンクリックハンドラー
  const handleSingleUpload = () => {
    console.log('Single upload clicked');
    setShowUploadModal(true);
  };

  const handleBatchUpload = () => {
    console.log('Batch upload clicked');
    setShowBatchUploadModal(true);
  };

  const handleDataInput = () => {
    console.log('Data input clicked');
    setShowDataInputModal(true);
  };

  const handleExpenseList = () => {
    console.log('Expense list clicked');
    setShowExpenseListModal(true);
  };

  const handleOptimizer = () => {
    console.log('Optimizer clicked');
    setShowOptimizerModal(true);
  };

  const handleReset = () => {
    if (confirm('すべてのデータをリセットしますか？この操作は元に戻せません。')) {
      localStorage.removeItem('user_info');
      localStorage.removeItem('expenses');
      setUserInfo(null);
      setFormData({
        email: '',
        targetMonth: '',
        department: '',
        budget: ''
      });
      alert('データがリセットされました。');
    }
  };

  // デバッグ用：現在の状態を表示
  console.log('Current render state - userInfo:', userInfo);
  console.log('Current render state - formData:', formData);

  // ローディング中は何も表示しない
  if (isLoading) {
    return null;
  }

  // 1ページ完結型のアプリケーション
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Expenscan</h1>
          {userInfo && (
            <div className="text-sm text-gray-300">
              ユーザー: {userInfo.email} | 部署: {userInfo.department} | 予算: ¥{userInfo.budget.toLocaleString()}
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* デバッグ情報 */}
        <div className="mb-4 p-2 bg-red-900 text-white text-xs">
          Debug: userInfo = {JSON.stringify(userInfo)}
        </div>

        {/* メインアプリケーション */}
        {userInfo && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">単一アップロード</h2>
                <p className="text-gray-400 mb-4">レシート画像を1枚ずつアップロードしてOCR処理を行います。</p>
                <button 
                  onClick={handleSingleUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  アップロード
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">一括アップロード</h2>
                <p className="text-gray-400 mb-4">複数のレシート画像を一度にアップロードして処理します。</p>
                <button 
                  onClick={handleBatchUpload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  一括アップロード
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">データ入力</h2>
                <p className="text-gray-400 mb-4">経費データを手動で入力・編集します。</p>
                <button 
                  onClick={handleDataInput}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  データ入力
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">経費一覧</h2>
                <p className="text-gray-400 mb-4">登録された経費データを一覧表示します。</p>
                <button 
                  onClick={handleExpenseList}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  一覧表示
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">予算最適化</h2>
                <p className="text-gray-400 mb-4">予算内で最適な経費の組み合わせを提案します。</p>
                <button 
                  onClick={handleOptimizer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  最適化
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">設定</h2>
                <p className="text-gray-400 mb-4">アプリケーションの設定を変更します。</p>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  設定変更
                </button>
                <button 
                  onClick={handleReset}
                  className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        )}

        {/* 設定画面 */}
        {!userInfo && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">初期設定</h2>
              <p className="text-xl text-gray-400">レシート経費管理システム</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4">初期設定</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">メールアドレス</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    value={formData.targetMonth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">部署</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
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
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="100000"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  設定を保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 単一アップロードモーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">単一アップロード</h2>
            <p className="text-gray-300 mb-4">レシート画像をアップロードしてOCR処理を行います。</p>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  アップロード
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 一括アップロードモーダル */}
      {showBatchUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">一括アップロード</h2>
            <p className="text-gray-300 mb-4">複数のレシート画像を一度にアップロードします。</p>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBatchUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  一括アップロード
                </button>
                <button
                  onClick={() => setShowBatchUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* データ入力モーダル */}
      {showDataInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">データ入力</h2>
            <p className="text-gray-300 mb-4">経費データを手動で入力します。</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">日付</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">金額</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">カテゴリ</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option>交通費</option>
                  <option>通信費</option>
                  <option>会議費</option>
                  <option>接待費</option>
                  <option>研修費</option>
                  <option>消耗品費</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDataInputModal(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowDataInputModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 経費一覧モーダル */}
      {showExpenseListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">経費一覧</h2>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300">現在、経費データはありません。</p>
                <p className="text-gray-400 text-sm mt-2">レシートをアップロードするか、データ入力で経費を追加してください。</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExpenseListModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 予算最適化モーダル */}
      {showOptimizerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">予算最適化</h2>
            <p className="text-gray-300 mb-4">予算内で最適な経費の組み合わせを提案します。</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">目標予算</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option value="100000">10万円</option>
                  <option value="150000">15万円</option>
                  <option value="200000">20万円</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowOptimizerModal(false)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  最適化実行
                </button>
                <button
                  onClick={() => setShowOptimizerModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
