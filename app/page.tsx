'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { loadUserDataByEmail } from '@/lib/storage';
import { APP_VERSION } from '@/lib/constants';
import { useAuthStore } from '@/lib/auth-store';
import { onAuthStateChange } from '@/lib/auth-service';
import { 
  syncUserData, 
  syncExpenseData, 
  restoreUserData, 
  saveOfflineData, 
  syncOnOnline,
  clearAllData,
  setupNetworkListener 
} from '@/lib/sync-service';
import ImageUpload from '@/components/ImageUpload';
import BatchUpload from '@/components/BatchUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import UserSetup from '@/components/UserSetup';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BudgetDisplay from '@/components/BudgetDisplay';
import AuthForm from '@/components/AuthForm';
import OfflineIndicator from '@/components/OfflineIndicator';
import NetworkStatus, { NetworkSimulator } from '@/components/NetworkStatus';
import { Settings, Menu, X, UploadCloud, FileText, Pencil, BarChart3, Camera, FolderOpen, Edit3, List, LogOut } from 'lucide-react';
import { ExpenseData } from '@/types';

// 型定義
interface UserData {
  email: string;
  targetMonth: string;
  budget: number;
  currency?: string;
}

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    budget: 100000
  });
  
  // 認証状態
  const { user, loading: authLoading, setUser, logout } = useAuthStore();
  
  // モーダル状態
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showDataInputModal, setShowDataInputModal] = useState(false);
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();

  // クライアントサイド判定
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 認証状態の監視とデータ同期
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
        
        // 非同期処理を別関数で実行
        const handleUserData = async () => {
          try {
            // 初回ログイン時のデータ復元
            const { userData, expenses: cloudExpenses } = await restoreUserData(user.uid);
            
            setUserInfo({
              email: userData.email,
              targetMonth: userData.targetMonth,
              budget: userData.budget,
              currency: userData.currency
            } as UserData);
            
            setFormData({
              email: userData.email || '',
              targetMonth: userData.targetMonth || '',
              budget: userData.budget || 100000
            });

            // クラウドデータをローカルストアに反映
            cloudExpenses.forEach(expense => {
              addExpense(expense);
            });

            // ユーザーデータの同期
            await syncUserData(user.uid, userData);
            
          } catch (error) {
            console.error('Error restoring user data:', error);
            // エラー時はローカルデータを使用
            setUserInfo({
              email: user.email,
              targetMonth: user.targetMonth,
              budget: user.budget,
              currency: user.currency
            } as UserData);
          }
        };
        
        handleUserData();
      } else {
        setUser(null);
        setUserInfo(null);
        // ログアウト時にデータをクリア
        clearAllData();
      }
    });

    return () => unsubscribe();
  }, [isClient, setUser, addExpense]);

  // 初期化（認証なしの場合）
  useEffect(() => {
    if (!isClient || user) return;

    try {
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
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }, [isClient, user]);

  // ストレージ変更の監視
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUserInfo(parsed);
          setFormData({
            email: parsed.email || '',
            targetMonth: parsed.targetMonth || '',
            budget: parsed.budget || 100000
          });
        } catch (error) {
          console.error('Failed to parse storage change:', error);
        }
      }
    };

    const handleStorageSync = (e: CustomEvent) => {
      const { email } = e.detail;
      if (email) {
        try {
          const userData = loadUserDataByEmail(email);
          if (userData) {
            setUserInfo(userData.userInfo);
            setFormData({
              email: userData.userInfo.email || '',
              targetMonth: userData.userInfo.targetMonth || '',
              budget: userData.userInfo.budget || 100000
            });
          }
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-sync', handleStorageSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-sync', handleStorageSync as EventListener);
    };
  }, [isClient]);

  const handleSettingsSave = (userData: UserData) => {
    if (!isClient) return;

    try {
      localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);
    setShowSettingsModal(false);
      
      // 他のタブに同期
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'userInfo',
        newValue: JSON.stringify(userData)
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = () => {
    if (!isClient) return;
    
    if (!formData.email || !formData.targetMonth || formData.budget <= 0) {
      alert(t('dataInput.validation.required', currentLanguage));
      return;
    }
    
    const userData = {
      email: formData.email,
      targetMonth: formData.targetMonth,
      budget: formData.budget
    };
    
    try {
      localStorage.setItem('userInfo', JSON.stringify(userData));
      setUserInfo(userData);
      
      // 他のタブに同期
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'userInfo',
        newValue: JSON.stringify(userData)
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(t('common.error', currentLanguage));
    }
  };

  const handleDataInputSave = async (expenseData: ExpenseData) => {
    addExpense(expenseData);
    
    // ユーザーがログインしている場合、クラウドに同期
    if (user?.uid) {
      try {
        await syncExpenseData(user.uid, [...expenses, expenseData]);
      } catch (error) {
        console.error('Error syncing expense data:', error);
        // オフライン時はローカルに保存
        saveOfflineData([...expenses, expenseData]);
      }
    }
    
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
    if (!isClient) return;

    if (confirm(t('common.confirmReset', currentLanguage))) {
      try {
        // clearExpenses(); // この機能は現在利用不可
        localStorage.removeItem('userInfo');
        setUserInfo(null);
        setFormData({
          email: '',
          targetMonth: '',
          budget: 100000
        });
      } catch (error) {
        console.error('Failed to reset data:', error);
      }
    }
  };

  const navigationItems = [
    { key: 'singleUpload', label: t('navigation.singleUpload', currentLanguage), action: handleSingleUpload },
    { key: 'batchUpload', label: t('navigation.batchUpload', currentLanguage), action: handleBatchUpload },
    { key: 'dataInput', label: t('navigation.dataInput', currentLanguage), action: handleDataInput },
    { key: 'expenseList', label: t('navigation.expenseList', currentLanguage), action: handleExpenseList },
    { key: 'budgetOptimizer', label: t('navigation.budgetOptimizer', currentLanguage), action: handleOptimizer },
  ];

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return (
      <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col">
      {/* ネットワーク状態監視 */}
      <NetworkStatus 
        onOnline={() => {
          // オンライン復帰時の同期処理
          if (user?.uid) {
            syncOnOnline(user.uid);
          }
        }}
        onOffline={() => {
          // オフライン時の処理
          console.log('App went offline');
        }}
        showDebugInfo={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
      />
      
      {/* 開発環境でのテスト用シミュレーター */}
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <NetworkSimulator />
      )}
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
              {/* デスクトップ: 言語切り替え */}
              <div className="hidden md:block">
                <LanguageSwitcher 
                  currentLanguage={currentLanguage} 
                  onLanguageChange={setCurrentLanguage} 
                />
              </div>
              
              {/* 認証状態に応じたボタン */}
              {user ? (
                <>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
                    title={t('common.settings', currentLanguage)}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        setUserInfo(null);
                        setFormData({
                          email: '',
                          targetMonth: '',
                          budget: 100000
                        });
                        // SWRキャッシュクリア
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('swr-cache');
                        }
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                    className="p-2 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200"
                    title="ログアウト"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                >
                  ログイン
                </button>
              )}
              
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
                {/* モバイル: 言語切り替え */}
                <div className="px-3 py-2">
                  <LanguageSwitcher 
                    currentLanguage={currentLanguage} 
                    onLanguageChange={setCurrentLanguage} 
                  />
                </div>
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
                        <Camera className="w-6 h-6 text-white" />
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
                        <FolderOpen className="w-6 h-6 text-white" />
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
                        <Edit3 className="w-6 h-6 text-white" />
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
                        <List className="w-6 h-6 text-white" />
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
                    className="w-full max-w-md px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full max-w-md px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full max-w-md px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowBatchUploadModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowDataInputModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowExpenseListModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowOptimizerModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-md border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('common.settings', currentLanguage)}</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <UserSetup onSave={handleSettingsSave} hideWelcomeTitle={true} />
          </div>
        </div>
      )}

      {/* 認証モーダル */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="bg-surface-900 rounded-lg p-6 w-full max-w-md border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                {authMode === 'login' ? 'ログイン' : '新規登録'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AuthForm 
              mode={authMode}
              onSuccess={(userInfo) => {
                setUser(userInfo);
                setUserInfo({
                  email: userInfo.email,
                  targetMonth: userInfo.targetMonth,
                  budget: userInfo.budget,
                  currency: userInfo.currency
                });
                setFormData({
                  email: userInfo.email || '',
                  targetMonth: userInfo.targetMonth || '',
                  budget: userInfo.budget || 100000
                });
                setShowAuthModal(false);
              }}
              onCancel={() => setShowAuthModal(false)}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                {authMode === 'login' 
                  ? 'アカウントをお持ちでない方はこちら' 
                  : '既にアカウントをお持ちの方はこちら'
                }
              </button>
            </div>
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
