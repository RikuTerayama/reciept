'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { loadUserDataByEmail } from '@/lib/storage';
import { APP_VERSION } from '@/lib/constants';
import ImageUpload from '@/components/ImageUpload';
import BatchUpload from '@/components/BatchUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import UserSetup from '@/components/UserSetup';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BudgetDisplay from '@/components/BudgetDisplay';
import { Settings, Menu, X } from 'lucide-react';

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [userInfo, setUserInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    budget: 100000
  });
  
  // モーダル状態
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showDataInputModal, setShowDataInputModal] = useState(false);
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { expenses, addExpense, updateExpense, deleteExpense, clearExpenses } = useExpenseStore();

  // 初期化
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      const parsed = JSON.parse(savedUserInfo);
      setUserInfo(parsed);
      setFormData({
        email: parsed.email || '',
        targetMonth: parsed.targetMonth || '',
        budget: parsed.budget || 100000
      });
    }
  }, []);

  // ストレージ変更の監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        setUserInfo(parsed);
        setFormData({
          email: parsed.email || '',
          targetMonth: parsed.targetMonth || '',
          budget: parsed.budget || 100000
        });
      }
    };

    const handleStorageSync = (e: CustomEvent) => {
      const { email } = e.detail;
      if (email) {
        const userData = loadUserDataByEmail(email);
        if (userData) {
          setUserInfo(userData.userInfo);
          setFormData({
            email: userData.userInfo.email || '',
            targetMonth: userData.userInfo.targetMonth || '',
            budget: userData.userInfo.budget || 100000
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-sync', handleStorageSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-sync', handleStorageSync as EventListener);
    };
  }, []);

  const handleSettingsSave = (userData: any) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);
    setShowSettingsModal(false);
    
    // 他のタブに同期
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userInfo',
      newValue: JSON.stringify(userData)
    }));
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = () => {
    if (!formData.email || !formData.targetMonth || formData.budget <= 0) {
      alert(t('dataInput.validation.required', currentLanguage));
      return;
    }

    const userData = {
      email: formData.email,
      targetMonth: formData.targetMonth,
      budget: formData.budget
    };

    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);
    
    // 他のタブに同期
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userInfo',
      newValue: JSON.stringify(userData)
    }));
  };

  const handleDataInputSave = (expenseData: any) => {
    addExpense(expenseData);
    setShowDataInputModal(false);
  };

  const handleSingleUpload = () => {
    setShowUploadModal(true);
  };

  const handleBatchUpload = () => {
    setShowBatchUploadModal(true);
  };

  const handleDataInput = () => {
    setShowDataInputModal(true);
  };

  const handleExpenseList = () => {
    setShowExpenseListModal(true);
  };

  const handleOptimizer = () => {
    setShowOptimizerModal(true);
  };

  const handleReset = () => {
    if (confirm(t('common.confirmReset', currentLanguage))) {
      clearExpenses();
      localStorage.removeItem('userInfo');
      setUserInfo(null);
      setFormData({
        email: '',
        targetMonth: '',
        budget: 100000
      });
    }
  };

  const navigationItems = [
    { key: 'singleUpload', label: t('navigation.singleUpload', currentLanguage), action: handleSingleUpload },
    { key: 'batchUpload', label: t('navigation.batchUpload', currentLanguage), action: handleBatchUpload },
    { key: 'dataInput', label: t('navigation.dataInput', currentLanguage), action: handleDataInput },
    { key: 'expenseList', label: t('navigation.expenseList', currentLanguage), action: handleExpenseList },
    { key: 'budgetOptimizer', label: t('navigation.budgetOptimizer', currentLanguage), action: handleOptimizer },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-surface-800 bg-surface-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左: ロゴ */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-lg font-semibold text-white">Expenscan</span>
              </div>
            </div>

            {/* 中央: ナビゲーション（デスクトップ） */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={item.action}
                  className="px-3 py-2 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* 右: アクション */}
            <div className="flex items-center space-x-3">
              <LanguageSwitcher 
                currentLanguage={currentLanguage} 
                onLanguageChange={setCurrentLanguage} 
              />
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
                title={t('common.settings', currentLanguage)}
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* モバイルメニューボタン */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* モバイルナビゲーション */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-surface-800 bg-surface-900/95 backdrop-blur-sm animate-slide-down">
              <nav className="flex flex-col space-y-1 py-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      item.action();
                      setShowMobileMenu(false);
                    }}
                    className="px-3 py-2 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 予算表示 */}
          {userInfo && <BudgetDisplay />}

          {/* メインコンテンツエリア */}
          <div className="mt-8">
            {userInfo ? (
              <div className="space-y-8">
                {/* クイックアクション */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={handleSingleUpload}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500 transition-colors">
                        <span className="text-white font-bold">📷</span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.singleUpload', currentLanguage)}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.singleUploadDesc', currentLanguage)}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleBatchUpload}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary-500 transition-colors">
                        <span className="text-white font-bold">📁</span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.batchUpload', currentLanguage)}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.batchUploadDesc', currentLanguage)}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleDataInput}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-500 transition-colors">
                        <span className="text-white font-bold">✏️</span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.dataInput', currentLanguage)}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.dataInputDesc', currentLanguage)}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleExpenseList}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500 transition-colors">
                        <span className="text-white font-bold">📊</span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.expenseList', currentLanguage)}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.expenseListDesc', currentLanguage)}</p>
                    </div>
                  </button>
                </div>

                {/* 統計情報 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        ¥{expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.totalAmount', currentLanguage)}</div>
                    </div>
                  </div>
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {expenses.length}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.totalExpenses', currentLanguage)}</div>
                    </div>
                  </div>
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {expenses.filter(exp => exp.isQualified.includes('Qualified')).length}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.qualifiedExpenses', currentLanguage)}</div>
                    </div>
                  </div>
                </div>

                {/* リセットボタン */}
                <div className="text-center">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm text-surface-400 hover:text-red-400 transition-colors duration-200"
                  >
                    {t('common.reset', currentLanguage)}
                  </button>
                </div>
              </div>
            ) : (
              // 設定画面
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-white">{t('welcome.title', currentLanguage)}</h2>
                  <p className="text-lg text-surface-400">{t('welcome.description', currentLanguage)}</p>
                </div>
                
                <div className="bg-surface-800 rounded-lg p-8 border border-surface-700">
                  <h3 className="text-xl font-semibold mb-6 text-center text-white">{t('common.settings', currentLanguage)}</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.email', currentLanguage)} *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="example@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.targetMonth', currentLanguage)} *</label>
                      <input
                        type="month"
                        name="targetMonth"
                        value={formData.targetMonth}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.budget', currentLanguage)} *</label>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        placeholder="100000"
                        min="0"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
                      >
                        {t('common.save', currentLanguage)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* モーダル */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('navigation.singleUpload', currentLanguage)}</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('navigation.batchUpload', currentLanguage)}</h2>
              <button
                onClick={() => setShowBatchUploadModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('navigation.dataInput', currentLanguage)}</h2>
              <button
                onClick={() => setShowDataInputModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ExpenseForm onSave={handleDataInputSave} />
          </div>
        </div>
      )}

      {showExpenseListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('navigation.expenseList', currentLanguage)}</h2>
              <button
                onClick={() => setShowExpenseListModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ExpenseList />
          </div>
        </div>
      )}

      {showOptimizerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('navigation.budgetOptimizer', currentLanguage)}</h2>
              <button
                onClick={() => setShowOptimizerModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BudgetOptimizer hideTitle={true} />
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-md border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('common.settings', currentLanguage)}</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <UserSetup onSave={handleSettingsSave} />
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="border-t border-surface-800 bg-surface-900/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* デスクトップ表示 */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <div className="text-sm text-surface-400">
                © 2025 Expenscan. All rights reserved. Developed by Riku Terayama
              </div>
            </div>
            <div className="text-sm text-surface-400">
              {t('common.version', currentLanguage)}: {APP_VERSION}
            </div>
          </div>
          
          {/* モバイル表示 */}
          <div className="md:hidden text-center text-sm text-surface-400 space-y-1 py-2">
            <div>v{APP_VERSION}</div>
            <div>© 2025 Expenscan. All rights reserved.</div>
            <div>Developed by Riku Terayama</div>
          </div>
        </div>
      </footer>
    </div>
  );
} 
