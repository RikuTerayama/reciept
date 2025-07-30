'use client';

// 静的生成を完全に無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// バージョン情報
const APP_VERSION = '1.0.0';

// React hooks
// @ts-ignore
import { useState, useEffect } from 'react';
// @ts-ignore
import { getCurrentLanguage, t } from '@/lib/i18n';
// @ts-ignore
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  // @ts-ignore
  const [userInfo, setUserInfo] = useState(null);
  // @ts-ignore
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // @ts-ignore
  const [showUploadModal, setShowUploadModal] = useState(false);
  // @ts-ignore
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  // @ts-ignore
  const [showDataInputModal, setShowDataInputModal] = useState(false);
  // @ts-ignore
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  // @ts-ignore
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  // @ts-ignore
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    budget: ''
  });
  // @ts-ignore
  const [isLoading, setIsLoading] = useState(true);
  // @ts-ignore
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  // 初期化処理
  // @ts-ignore
  useEffect(() => {
    try {
      const savedUserInfo = localStorage.getItem('user_info');
      console.log('Loading user info:', savedUserInfo);
      if (savedUserInfo) {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
        console.log('User info loaded:', parsed);
      }
    } catch (error) {
      console.error('Failed to parse saved user info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSettingsSave = (userData: any) => {
    console.log('Saving settings:', userData);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUserInfo(userData);
    setShowSettingsModal(false);
  };

  // フォームデータの更新
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 設定保存ボタンクリック
  const handleSaveSettings = () => {
    console.log('Save settings clicked');
    // バリデーション
    if (!formData.email || !formData.targetMonth || !formData.budget || Number(formData.budget) <= 0) {
      alert(t('dataInput.validation.required', currentLanguage));
      return;
    }
    
    const userData = {
      email: formData.email,
      targetMonth: formData.targetMonth,
      budget: Number(formData.budget)
    };
    
    try {
      // localStorageに保存
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      // 状態を更新
      setUserInfo(userData);
      
      // 成功メッセージ
      alert(t('common.success', currentLanguage));
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert(t('common.error', currentLanguage));
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
    console.log('Reset clicked');
    if (confirm(t('common.confirm', currentLanguage))) {
      localStorage.removeItem('user_info');
      localStorage.removeItem('expenses');
      setUserInfo(null);
      setFormData({
        email: '',
        targetMonth: '',
        budget: ''
      });
      alert(t('common.success', currentLanguage));
    }
  };

  // ローディング中は何も表示しない
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('common.loading', currentLanguage)}</p>
        </div>
      </div>
    );
  }

  // 1ページ完結型のアプリケーション
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <header className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/Expenscan_logo.png" 
              alt="Expenscan Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                // ロゴ画像が存在しない場合のフォールバック
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-2xl font-bold">{t('header.title', currentLanguage)}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher 
              onLanguageChange={(language) => setCurrentLanguage(language)}
            />
            {userInfo && (
              <div className="text-sm text-gray-300">
                {t('common.user', currentLanguage)}: {userInfo.email} | {t('common.budget', currentLanguage)}: ¥{userInfo.budget.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
        {/* メインアプリケーション */}
        {userInfo && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('navigation.singleUpload', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('imageUpload.description', currentLanguage)}</p>
                <button 
                  onClick={handleSingleUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.upload', currentLanguage)}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('navigation.batchUpload', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('batchUpload.description', currentLanguage)}</p>
                <button 
                  onClick={handleBatchUpload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('batchUpload.title', currentLanguage)}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('navigation.dataInput', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('dataInput.description', currentLanguage)}</p>
                <button 
                  onClick={handleDataInput}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('dataInput.title', currentLanguage)}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('navigation.expenseList', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('expenseList.description', currentLanguage)}</p>
                <button 
                  onClick={handleExpenseList}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('expenseList.title', currentLanguage)}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('navigation.budgetOptimizer', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('budgetOptimizer.description', currentLanguage)}</p>
                <button 
                  onClick={handleOptimizer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t('budgetOptimizer.optimize', currentLanguage)}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{t('common.settings', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4">{t('common.settings', currentLanguage)}</p>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  {t('common.edit', currentLanguage)}
                </button>
                <button 
                  onClick={handleReset}
                  className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('common.delete', currentLanguage)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 設定画面 */}
        {!userInfo && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">{t('welcome.title', currentLanguage)}</h2>
              <p className="text-xl text-gray-400">{t('welcome.description', currentLanguage)}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4">{t('common.settings', currentLanguage)}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.email', currentLanguage)}</label>
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
                  <label className="block text-sm font-medium mb-2">{t('common.targetMonth', currentLanguage)}</label>
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
                  <label className="block text-sm font-medium mb-2">{t('common.budget', currentLanguage)}</label>
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
                  {t('common.save', currentLanguage)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="bg-gray-800 p-4 mt-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/Expenscan_logo_side.png" 
              alt="Expenscan Logo" 
              className="h-6 w-auto"
              onError={(e) => {
                // ロゴ画像が存在しない場合のフォールバック
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm text-gray-400">
              {t('footer.copyright', currentLanguage)}
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {t('common.version', currentLanguage)}: {APP_VERSION}
          </div>
        </div>
      </footer>

      {/* 単一アップロードモーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">{t('singleUpload.title', currentLanguage)}</h2>
            <p className="text-gray-300 mb-4">{t('singleUpload.description', currentLanguage)}</p>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    alert(t('singleUpload.upload.placeholder', currentLanguage));
                    setShowUploadModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.upload', currentLanguage)}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel', currentLanguage)}
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
            <h2 className="text-2xl font-semibold mb-4">{t('batchUpload.title', currentLanguage)}</h2>
            <p className="text-gray-300 mb-4">{t('batchUpload.description', currentLanguage)}</p>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    alert(t('batchUpload.upload.placeholder', currentLanguage));
                    setShowBatchUploadModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('batchUpload.title', currentLanguage)}
                </button>
                <button
                  onClick={() => setShowBatchUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel', currentLanguage)}
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
            <h2 className="text-2xl font-semibold mb-4">{t('dataInput.title', currentLanguage)}</h2>
            <p className="text-gray-300 mb-4">{t('dataInput.description', currentLanguage)}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('dataInput.date', currentLanguage)}</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('dataInput.amount', currentLanguage)}</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('dataInput.category', currentLanguage)}</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option>{t('category.transportation', currentLanguage)}</option>
                  <option>{t('category.communication', currentLanguage)}</option>
                  <option>{t('category.meeting', currentLanguage)}</option>
                  <option>{t('category.entertainment', currentLanguage)}</option>
                  <option>{t('category.training', currentLanguage)}</option>
                  <option>{t('category.supplies', currentLanguage)}</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    alert(t('dataInput.save.placeholder', currentLanguage));
                    setShowDataInputModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('common.save', currentLanguage)}
                </button>
                <button
                  onClick={() => setShowDataInputModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel', currentLanguage)}
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
            <h2 className="text-2xl font-semibold mb-4">{t('expenseList.title', currentLanguage)}</h2>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300">{t('expenseList.noData', currentLanguage)}</p>
                <p className="text-gray-400 text-sm mt-2">{t('expenseList.addData', currentLanguage)}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExpenseListModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.close', currentLanguage)}
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
            <h2 className="text-2xl font-semibold mb-4">{t('budgetOptimizer.title', currentLanguage)}</h2>
            <p className="text-gray-300 mb-4">{t('budgetOptimizer.description', currentLanguage)}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('budgetOptimizer.targetBudget', currentLanguage)}</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  <option value="100000">{t('budgetOptimizer.option1', currentLanguage)}</option>
                  <option value="150000">{t('budgetOptimizer.option2', currentLanguage)}</option>
                  <option value="200000">{t('budgetOptimizer.option3', currentLanguage)}</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    alert(t('budgetOptimizer.optimize.placeholder', currentLanguage));
                    setShowOptimizerModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t('budgetOptimizer.optimize', currentLanguage)}
                </button>
                <button
                  onClick={() => setShowOptimizerModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel', currentLanguage)}
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
            <h2 className="text-2xl font-semibold mb-4">{t('common.edit', currentLanguage)}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email') as string,
                targetMonth: formData.get('targetMonth') as string,
                budget: Number(formData.get('budget'))
              };
              
              if (!userData.email || !userData.targetMonth || userData.budget <= 0) {
                alert(t('dataInput.validation.required', currentLanguage));
                return;
              }
              
              handleSettingsSave(userData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.email', currentLanguage)}</label>
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
                  <label className="block text-sm font-medium mb-2">{t('common.targetMonth', currentLanguage)}</label>
                  <input
                    type="month"
                    name="targetMonth"
                    defaultValue={userInfo.targetMonth}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.budget', currentLanguage)}</label>
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
                    {t('common.save', currentLanguage)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel', currentLanguage)}
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
