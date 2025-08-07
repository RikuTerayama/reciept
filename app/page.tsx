'use client';

import React, { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
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
import { calculateTotalAmountWithRounding } from '@/lib/currency';

// 型定義
interface UserData {
  email: string;
  targetMonth: string;
  budget: number;
  currency?: string;
  office?: string;
}

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    budget: 100000,
    office: 'japan' // デフォルトで日本を選択
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
  const [isLoading, setIsLoading] = useState(true);

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();

  // クライアントサイド判定と初期化
  useEffect(() => {
    console.log('Home component mounting...');
    setIsClient(true);
    
    // 初期化処理
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // ローカルストレージからユーザー情報を読み込み
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const parsed = JSON.parse(savedUserInfo);
          setUserInfo(parsed);
          setFormData({
            email: parsed.email || '',
            targetMonth: parsed.targetMonth || '',
            budget: parsed.budget || 100000,
            office: parsed.office || 'japan'
          });
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // 認証状態の監視とデータ同期
  useEffect(() => {
    if (!isClient) return;

    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      
      if (user) {
        setUser(user);
        
        // 非同期処理を別関数で実行
        const handleUserData = async () => {
          try {
            console.log('Restoring user data...');
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
              budget: userData.budget || 100000,
              office: userData.office || 'japan'
            });

            // クラウドデータをローカルストアに反映
            cloudExpenses.forEach(expense => {
              addExpense(expense);
            });

            // ユーザーデータの同期
            await syncUserData(user.uid, userData);
            
            console.log('User data restored successfully');
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
        console.log('User logged out, data cleared');
      }
    });

    return () => unsubscribe();
  }, [isClient, setUser, addExpense]);

  // 初期化（認証なしの場合）
  useEffect(() => {
    if (!isClient || user) return;

    console.log('Loading local user data...');
    
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
        setFormData({
          email: parsed.email || '',
          targetMonth: parsed.targetMonth || '',
          budget: parsed.budget || 100000,
          office: parsed.office || 'japan'
        });
        console.log('Local user data loaded');
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
            budget: parsed.budget || 100000,
            office: parsed.office || 'japan'
          });
        } catch (error) {
          console.error('Failed to parse storage change:', error);
        }
      }
    };

    const handleStorageSync = async (e: CustomEvent) => {
      const { email } = e.detail;
      if (email) {
        try {
          const userData = await loadUserDataByEmail(email);
          if (userData && userData.settings) {
            setUserInfo(userData.settings);
            setFormData({
              email: userData.settings.email || '',
              targetMonth: userData.settings.targetMonth || '',
              budget: userData.settings.budget || 100000,
              office: userData.settings.office || 'japan'
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
      alert(t('dataInput.validation.required', currentLanguage, 'この項目は必須です'));
      return;
    }
    
    const userData = {
      email: formData.email,
      targetMonth: formData.targetMonth,
      budget: formData.budget,
      office: formData.office
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
      alert(t('common.error', currentLanguage, 'エラーが発生しました'));
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

          if (confirm(t('common.confirmReset', currentLanguage, 'すべてのデータをリセットしますか？'))) {
      try {
        // clearExpenses(); // この機能は現在利用不可
        localStorage.removeItem('userInfo');
        setUserInfo(null);
        setFormData({
          email: '',
          targetMonth: '',
          budget: 100000,
          office: 'japan'
        });
      } catch (error) {
        console.error('Failed to reset data:', error);
      }
    }
  };

  const navigationItems = [
            { key: 'singleUpload', label: t('navigation.singleUpload', currentLanguage, '単一アップロード'), action: handleSingleUpload },
        { key: 'batchUpload', label: t('navigation.batchUpload', currentLanguage, '一括アップロード'), action: handleBatchUpload },
        { key: 'dataInput', label: t('navigation.dataInput', currentLanguage, 'データ入力'), action: handleDataInput },
        { key: 'expenseList', label: t('navigation.expenseList', currentLanguage, '経費リスト'), action: handleExpenseList },
        { key: 'budgetOptimizer', label: t('navigation.budgetOptimizer', currentLanguage, '予算最適化'), action: handleOptimizer },
  ];

  // ローディング状態の表示
  if (isLoading || !isClient) {
    console.log('Rendering loading state...');
    return (
      <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-surface-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app...', { userInfo, user, isClient });

  return (
    <SWRConfig
      value={{
        fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
        revalidateOnFocus: false,
        dedupingInterval: 10000,
        errorRetryCount: 2,
        onError: (error) => {
          console.error('SWR Error:', error);
        },
      }}
    >
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // ホームページに戻る処理
                  window.location.reload();
                }}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
                title="ホームに戻る"
              >
                <img 
                  src="/Expenscan_new_logo.png" 
                  alt="Expenscan Logo" 
                  className="h-8 w-auto object-contain max-w-full sm:h-10"
                  style={{ maxHeight: '40px' }}
                  onError={(e) => {
                    console.error('Logo image failed to load');
                    // フォールバック: テキストロゴ
                    e.currentTarget.style.display = 'none';
                    const textLogo = document.createElement('div');
                    textLogo.className = 'flex items-center space-x-2';
                    textLogo.innerHTML = '<span class="text-xl font-bold text-white">Expens</span><span class="text-xl font-bold text-cyan-400">can</span>';
                    e.currentTarget.parentNode?.appendChild(textLogo);
                  }}
                  onLoad={() => {
                    console.log('Logo loaded successfully');
                  }}
                />
              </button>
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
                    title={t('common.settings', currentLanguage, '設定')}
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
                          budget: 100000,
                          office: 'japan'
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
                    className="px-3 py-2 text-sm font-medium text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 text-center"
                  >
                    {item.label}
                  </button>
                ))}
                {/* モバイル: 言語切り替え */}
                <div className="px-3 py-2 flex justify-center">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <button
                    onClick={handleSingleUpload}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500 transition-colors">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.singleUpload', currentLanguage, '単一アップロード')}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.singleUploadDesc', currentLanguage, 'レシート画像を1枚ずつアップロードしてOCR処理')}</p>
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
                      <h3 className="font-medium text-white mb-1">{t('navigation.batchUpload', currentLanguage, '一括アップロード')}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.batchUploadDesc', currentLanguage, '複数のレシート画像を同時にアップロードして一括処理')}</p>
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
                      <h3 className="font-medium text-white mb-1">{t('navigation.dataInput', currentLanguage, 'データ入力')}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.dataInputDesc', currentLanguage, '経費情報を手動で入力・編集')}</p>
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
                      <h3 className="font-medium text-white mb-1">{t('navigation.expenseList', currentLanguage, '経費リスト')}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.expenseListDesc', currentLanguage, '登録済み経費の一覧表示と管理')}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleOptimizer}
                    className="p-6 bg-surface-800 hover:bg-surface-700 rounded-lg border border-surface-700 hover:border-surface-600 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500 transition-colors">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-medium text-white mb-1">{t('navigation.budgetOptimizer', currentLanguage, '予算最適化')}</h3>
                      <p className="text-sm text-surface-400">{t('navigation.budgetOptimizerDesc', currentLanguage, '指定された予算に最も近い経費の組み合わせを自動提案')}</p>
                    </div>
                  </button>
                </div>

                {/* 統計情報 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        ¥{(() => {
                            // 外貨の切り上げ処理を含む合計計算
                            const total = expenses.reduce((sum, exp) => {
                                if (exp.currency === 'JPY') {
                                    return sum + exp.totalAmount;
                                } else {
                                    // 外貨の場合は切り上げ処理
                                    const convertedAmount = Math.ceil(exp.totalAmount / (exp.conversionRate || 1));
                                    return sum + convertedAmount;
                                }
                            }, 0);
                            return total.toLocaleString();
                        })()}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.totalAmount', currentLanguage, '総金額')}</div>
                    </div>
                  </div>
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {expenses.length}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.totalExpenses', currentLanguage, '総経費数')}</div>
                    </div>
                  </div>
                  <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {expenses.filter(exp => exp.isQualified.includes('Qualified')).length}
                      </div>
                      <div className="text-sm text-surface-400">{t('stats.qualifiedExpenses', currentLanguage, '適格経費')}</div>
                    </div>
                  </div>
              </div>

                {/* リセットボタン */}
                <div className="text-center">
                <button 
                    onClick={handleReset}
                    className="px-4 py-2 text-sm text-surface-400 hover:text-red-400 transition-colors duration-200"
                  >
                    {t('common.reset', currentLanguage, 'リセット')}
                </button>
              </div>
            </div>
            ) : (
              // 設定画面
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 text-white">{t('welcome.title', currentLanguage, 'Welcome')}</h2>
                </div>
                
                <div className="bg-surface-800 rounded-lg p-8 border border-surface-700 mx-auto">
                  <h3 className="text-xl font-semibold mb-6 text-center text-white">{t('common.settings', currentLanguage, '設定')}</h3>
              
                  <div className="space-y-6 max-w-md mx-auto">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.email', currentLanguage, 'メールアドレス')} *</label>
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
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.targetMonth', currentLanguage, '対象月')} *</label>
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
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('common.budget', currentLanguage, '予算')} *</label>
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
                    <div>
                      <label className="block text-sm font-medium mb-2 text-surface-300">{t('welcome.officeSelection', currentLanguage, 'オフィス選択')} *</label>
                      <select
                        name="office"
                        value={formData.office}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="singapore">{t('welcome.offices.singapore', currentLanguage, 'シンガポール')}</option>
                        <option value="japan">{t('welcome.offices.japan', currentLanguage, '日本')}</option>
                        <option value="shanghai">{t('welcome.offices.shanghai', currentLanguage, '上海')}</option>
                        <option value="hongkong">{t('welcome.offices.hongkong', currentLanguage, '香港')}</option>
                        <option value="taiwan">{t('welcome.offices.taiwan', currentLanguage, '台湾')}</option>
                        <option value="indonesiaJakarta">{t('welcome.offices.indonesiaJakarta', currentLanguage, 'インドネシア - ジャカルタ')}</option>
                        <option value="indonesiaSurabaya">{t('welcome.offices.indonesiaSurabaya', currentLanguage, 'インドネシア - スラバヤ')}</option>
                        <option value="malaysia">{t('welcome.offices.malaysia', currentLanguage, 'マレーシア')}</option>
                        <option value="philippines">{t('welcome.offices.philippines', currentLanguage, 'フィリピン')}</option>
                        <option value="thailand">{t('welcome.offices.thailand', currentLanguage, 'タイ')}</option>
                        <option value="vietnam">{t('welcome.offices.vietnam', currentLanguage, 'ベトナム')}</option>
                        <option value="indiaBangalore">{t('welcome.offices.indiaBangalore', currentLanguage, 'インド - バンガロール')}</option>
                        <option value="indiaGurgaon">{t('welcome.offices.indiaGurgaon', currentLanguage, 'インド - グルガオン')}</option>
                        <option value="indiaMumbai">{t('welcome.offices.indiaMumbai', currentLanguage, 'インド - ムンバイ')}</option>
                        <option value="indiaNewDelhi">{t('welcome.offices.indiaNewDelhi', currentLanguage, 'インド - ニューデリー')}</option>
                        <option value="uae">{t('welcome.offices.uae', currentLanguage, 'アラブ首長国連邦')}</option>
                        <option value="canada">{t('welcome.offices.canada', currentLanguage, 'カナダ')}</option>
                        <option value="usaNewYork">{t('welcome.offices.usaNewYork', currentLanguage, 'アメリカ合衆国 - ニューヨーク')}</option>
                        <option value="netherlands">{t('welcome.offices.netherlands', currentLanguage, 'オランダ')}</option>
                        <option value="france">{t('welcome.offices.france', currentLanguage, 'フランス')}</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
                      >
                        {t('common.save', currentLanguage, '保存')}
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
            className="bg-surface-900 rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="flex-1"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center flex-1">{t('navigation.singleUpload', currentLanguage, '単一アップロード')}</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 flex-1 flex justify-end"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <ImageUpload 
                onOCRComplete={(ocrResult) => {
                  console.log('OCR Result:', ocrResult);
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
              <div className="flex-1"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center flex-1">{t('navigation.batchUpload', currentLanguage, '一括アップロード')}</h2>
              <button
                onClick={() => setShowBatchUploadModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 flex-1 flex justify-end"
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
              <div className="flex-1"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center flex-1">{t('navigation.dataInput', currentLanguage, 'データ入力')}</h2>
              <button
                onClick={() => setShowDataInputModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 flex-1 flex justify-end"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <ExpenseForm onSave={handleDataInputSave} />
            </div>
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
              <div className="flex-1"></div>
              <h2 className="text-base sm:text-xl font-semibold text-white text-center flex-1 break-keep">{t('navigation.expenseList', currentLanguage, '経費リスト')} {expenses.length}{t('common.items', currentLanguage, '件')} {t('expenseList.description', currentLanguage, 'の登録された経費データの一覧と管理')}</h2>
              <button
                onClick={() => setShowExpenseListModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 flex-1 flex justify-end"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <ExpenseList />
            </div>
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
              <div className="flex-1"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center flex-1">{t('navigation.budgetOptimizer', currentLanguage, '予算最適化')}</h2>
              <button
                onClick={() => setShowOptimizerModal(false)}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200 flex-1 flex justify-end"
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
                              <h2 className="text-lg sm:text-xl font-semibold text-white">{t('common.settings', currentLanguage, '設定')}</h2>
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
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {authMode === 'login' ? t('auth.login', currentLanguage, 'ログイン') : t('auth.register', currentLanguage, '新規登録')}
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
                  currency: userInfo.currency,
                  office: userInfo.office
                });
                setFormData({
                  email: userInfo.email || '',
                  targetMonth: userInfo.targetMonth || '',
                  budget: userInfo.budget || 100000,
                  office: userInfo.office || 'japan'
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
                  ? t('auth.noAccount', currentLanguage, 'アカウントをお持ちでない方はこちら')
                  : t('auth.hasAccount', currentLanguage, '既にアカウントをお持ちの方はこちら')
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // ホームページに戻る処理
                  window.location.reload();
                }}
                className="flex items-center hover:opacity-80 transition-opacity duration-200"
                title="ホームに戻る"
              >
                <img 
                  src="/Expenscan_new_logo.png" 
                  alt="Expenscan Logo" 
                  className="h-6 w-auto object-contain"
                  onError={(e) => {
                    console.error('Footer logo image failed to load');
                    // フォールバック: テキストロゴ
                    e.currentTarget.style.display = 'none';
                    const textLogo = document.createElement('div');
                    textLogo.className = 'flex items-center space-x-2';
                    textLogo.innerHTML = '<span class="text-lg font-bold text-white">Expens</span><span class="text-lg font-bold text-cyan-400">can</span>';
                    e.currentTarget.parentNode?.appendChild(textLogo);
                  }}
                />
              </button>
              <div className="text-sm text-surface-400">
                © 2025 Expenscan. All rights reserved. Developed by Riku Terayama
              </div>
            </div>
            <div className="text-sm text-surface-400">
              {t('common.version', currentLanguage, 'バージョン')}: {APP_VERSION}
            </div>
          </div>
          
          {/* モバイル表示 */}
          <div className="md:hidden text-center text-sm text-surface-400 space-y-2 py-2">
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // ホームページに戻る処理
                  window.location.reload();
                }}
                className="flex items-center hover:opacity-80 transition-opacity duration-200"
                title="ホームに戻る"
              >
                <img 
                  src="/Expenscan_new_logo.png" 
                  alt="Expenscan Logo" 
                  className="h-5 w-auto object-contain"
                  onError={(e) => {
                    console.error('Mobile footer logo image failed to load');
                    // フォールバック: テキストロゴ
                    e.currentTarget.style.display = 'none';
                    const textLogo = document.createElement('div');
                    textLogo.className = 'flex items-center space-x-2 justify-center';
                    textLogo.innerHTML = '<span class="text-base font-bold text-white">Expens</span><span class="text-base font-bold text-cyan-400">can</span>';
                    e.currentTarget.parentNode?.appendChild(textLogo);
                  }}
                />
              </button>
            </div>
            <div>v{APP_VERSION}</div>
            <div>© 2025 Expenscan. All rights reserved.</div>
            <div>Developed by Riku Terayama</div>
          </div>
        </div>
      </footer>
    </div>
    </SWRConfig>
  );
} 
