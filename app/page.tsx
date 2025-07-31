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
// @ts-ignore
import ImageUpload from '@/components/ImageUpload';
// @ts-ignore
import BatchUpload from '@/components/BatchUpload';
// @ts-ignore
import ExpenseForm from '@/components/ExpenseForm';
// @ts-ignore
import ExpenseList from '@/components/ExpenseList';
// @ts-ignore
import BudgetOptimizer from '@/components/BudgetOptimizer';

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
      
      // サイレント保存 - ポップアップを表示しない
      
    } catch (error) {
      console.error('Error saving data:', error);
      // エラーの場合のみサイレントにしない
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
      // サイレントリセット - ポップアップを表示しない
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
              <div className="hidden lg:block text-sm text-gray-300">
                {t('common.user', currentLanguage)}: {userInfo.email} | {t('common.budget', currentLanguage)}: ¥{userInfo.budget.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </header>

              {/* メインコンテンツ */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メインアプリケーション */}
        {userInfo && (
          <div className="max-w-full overflow-hidden text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('navigation.singleUpload', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('imageUpload.description', currentLanguage)}</p>
                <div className="flex justify-center sm:justify-start">
                  <button 
                    onClick={handleSingleUpload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    {t('common.upload', currentLanguage)}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('navigation.batchUpload', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('batchUpload.description', currentLanguage)}</p>
                <div className="flex justify-center sm:justify-start">
                  <button 
                    onClick={handleBatchUpload}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                  >
                    {t('batchUpload.title', currentLanguage)}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('navigation.dataInput', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('dataInput.description', currentLanguage)}</p>
                <div className="flex justify-center sm:justify-start">
                  <button 
                    onClick={handleDataInput}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                  >
                    {t('dataInput.title', currentLanguage)}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('navigation.expenseList', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('expenseList.description', currentLanguage)}</p>
                <div className="flex justify-center sm:justify-start">
                  <button 
                    onClick={handleExpenseList}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
                  >
                    {t('expenseList.title', currentLanguage)}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('navigation.budgetOptimizer', currentLanguage)}</h2>
                <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('budgetOptimizer.description', currentLanguage)}</p>
                <div className="flex justify-center sm:justify-start">
                  <button 
                    onClick={handleOptimizer}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                  >
                    {t('budgetOptimizer.optimize', currentLanguage)}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col h-full">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">{t('common.settings', currentLanguage)}</h2>
                  <p className="text-gray-400 mb-4 text-center sm:text-left text-sm sm:text-base">{t('common.settings', currentLanguage)}</p>
                  <div className="flex justify-center sm:justify-start">
                    <button 
                      onClick={() => setShowSettingsModal(true)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base"
                    >
                      {t('common.edit', currentLanguage)}
                    </button>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700">
                  <button 
                    onClick={handleReset}
                    className="w-full px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    個人設定を編集可能
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 設定画面 */}
        {!userInfo && (
          <div className="max-w-4xl mx-auto max-w-full overflow-hidden text-center">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('welcome.title', currentLanguage)}</h2>
              <p className="text-lg sm:text-xl text-gray-400">{t('welcome.description', currentLanguage)}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">{t('common.settings', currentLanguage)}</h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.email', currentLanguage)} *</label>
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
                  <label className="block text-sm font-medium mb-2">{t('common.targetMonth', currentLanguage)} *</label>
                  <input
                    type="month"
                    name="targetMonth"
                    value={formData.targetMonth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.budget', currentLanguage)} *</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="100000"
                    min="0"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    {t('common.save', currentLanguage)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

            {/* フッター */}
      <footer className="bg-gray-800 p-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          {/* デスクトップ表示 */}
          <div className="hidden md:flex justify-between items-center">
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
                © 2025 Expenscan. All rights reserved. Developed by Riku Terayama
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {t('common.version', currentLanguage)}: {APP_VERSION}
            </div>
          </div>
          
          {/* モバイル表示 */}
          <div className="md:hidden text-center text-sm text-gray-400 space-y-1 py-2">
            <div>v{APP_VERSION}</div>
            <div>© 2025 Expenscan. All rights reserved. Developed by Riku Terayama</div>
          </div>
        </div>
      </footer>

      {/* モーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">{t('navigation.singleUpload', currentLanguage)}</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <ImageUpload 
              onOCRComplete={() => {
                setShowUploadModal(false);
                setShowDataInputModal(true);
              }}
              onComplete={() => {
                setShowUploadModal(false);
                setShowDataInputModal(true);
              }}
            />
          </div>
        </div>
      )}

      {showBatchUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">{t('navigation.batchUpload', currentLanguage)}</h2>
              <button
                onClick={() => setShowBatchUploadModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <BatchUpload 
              onComplete={() => {
                setShowBatchUploadModal(false);
                setShowDataInputModal(true);
              }}
            />
          </div>
        </div>
      )}

      {showDataInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">{t('navigation.dataInput', currentLanguage)}</h2>
              <button
                onClick={() => setShowDataInputModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <ExpenseForm 
              onSave={(expenseData) => {
                console.log('Expense saved:', expenseData);
                setShowDataInputModal(false);
              }}
              onCancel={() => setShowDataInputModal(false)}
            />
          </div>
        </div>
      )}

      {showExpenseListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">{t('navigation.expenseList', currentLanguage)}</h2>
              <button
                onClick={() => setShowExpenseListModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <ExpenseList />
          </div>
        </div>
      )}

      {showOptimizerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">{t('navigation.budgetOptimizer', currentLanguage)}</h2>
              <button
                onClick={() => setShowOptimizerModal(false)}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <BudgetOptimizer />
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
