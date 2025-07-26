'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, FileText, Calculator, Download, Plus, List, BarChart3, Settings, Sparkles, Upload, Menu, X, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import BatchUpload from '@/components/BatchUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import WelcomeScreen from '@/components/WelcomeScreen';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserSetup from '@/components/UserSetup';
import MobileStatistics from '@/components/MobileStatistics';
import EnhancedImageUpload from '@/components/EnhancedImageUpload';
import ExpenscanLogo from '@/components/ExpenscanLogo';
import { ToastContainer, useToast } from '@/components/Toast';
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';
import { t, getCurrentLanguage, Language } from '@/lib/i18n';
import { ExpenseData } from '@/types';

type TabType = 'upload' | 'batch' | 'form' | 'list' | 'optimizer';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage());
  const { expenses, selectedExpenses, clearSelection } = useExpenseStore();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // 初回訪問チェックとユーザー情報チェック
  useEffect(() => {
    const hasVisited = localStorage.getItem('receipt_expense_manager_visited');
    const savedUserInfo = localStorage.getItem('user_info');
    
    console.log('Initial load - hasVisited:', hasVisited, 'savedUserInfo:', savedUserInfo);
    
    if (hasVisited) {
      console.log('User has visited before, skipping welcome screen');
      setShowWelcome(false);
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo);
          console.log('Parsed user info:', parsed);
          setUserInfo(parsed);
        } catch (error) {
          console.error('Failed to parse saved user info:', error);
          setShowUserSetup(true);
        }
      } else {
        console.log('No saved user info, showing user setup');
        setShowUserSetup(true);
      }
    } else {
      console.log('First visit, showing welcome screen');
      localStorage.setItem('receipt_expense_manager_visited', 'true');
    }
  }, []);

  // WelcomeScreenのタイムアウト処理
  useEffect(() => {
    if (showWelcome) {
      const timeout = setTimeout(() => {
        console.log('WelcomeScreen timeout - forcing completion');
        handleWelcomeComplete();
      }, 10000); // 10秒後に強制スキップ

      return () => clearTimeout(timeout);
    }
  }, [showWelcome]);

  const handleWelcomeComplete = () => {
    console.log('Welcome screen completed, showing user setup');
    setShowWelcome(false);
    setShowUserSetup(true);
  };

  const handleUserSetupComplete = (userData: UserInfo) => {
    console.log('User setup completed:', userData);
    setUserInfo(userData);
    setShowUserSetup(false);
  };

  const handleExportAll = () => {
    if (expenses.length === 0) {
      showError('エクスポートするデータがありません', '経費データを追加してからエクスポートしてください');
      return;
    }
    exportExpensesToExcel(expenses, 'all_expenses.xlsx');
    showSuccess('エクスポート完了', `${expenses.length}件の経費データをエクスポートしました`);
  };

  const handleExportSelected = () => {
    if (selectedExpenses.length === 0) {
      showError('エクスポートするデータがありません', 'エクスポートする経費を選択してください');
      return;
    }
    const selectedExpenseData = expenses.filter(expense => 
      selectedExpenses.includes(expense.id)
    );
    exportExpensesToExcel(selectedExpenseData, 'selected_expenses.xlsx');
    showSuccess('エクスポート完了', `${selectedExpenses.length}件の経費データをエクスポートしました`);
  };

  // OCR完了後の自動遷移処理
  const handleOCRComplete = () => {
    setActiveTab('form');
  };

  // モバイルメニューのタブ切り替え
  const handleMobileTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // 言語変更ハンドラー
  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  // デバッグ用：ローカルストレージリセット
  const resetLocalStorage = () => {
    localStorage.removeItem('receipt_expense_manager_visited');
    localStorage.removeItem('user_info');
    window.location.reload();
  };

  const tabs = [
    { 
      id: 'upload' as TabType, 
      label: t('navigation.singleUpload'), 
      icon: Receipt, 
      description: t('imageUpload.description'),
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'batch' as TabType, 
      label: t('navigation.batchUpload'), 
      icon: Upload, 
      description: t('batchUpload.description'),
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'form' as TabType, 
      label: t('navigation.dataInput'), 
      icon: Plus, 
      description: t('dataInput.description'),
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'list' as TabType, 
      label: t('navigation.expenseList'), 
      icon: List, 
      description: t('expenseList.description'),
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'optimizer' as TabType, 
      label: t('navigation.budgetOptimizer'), 
      icon: Calculator, 
      description: t('budgetOptimizer.description'),
      color: 'from-indigo-500 to-purple-500'
    },
  ];

  const totalAmount = expenses.reduce((sum: number, exp: ExpenseData) => sum + exp.totalAmount, 0);
  const selectedAmount = expenses
    .filter((exp: ExpenseData) => selectedExpenses.includes(exp.id))
    .reduce((sum: number, exp: ExpenseData) => sum + exp.totalAmount, 0);

  // ウェルカムスクリーンが表示されている間はメインコンテンツを非表示
  if (showWelcome) {
    return (
      <div className="relative">
        <WelcomeScreen onComplete={handleWelcomeComplete} />
        {/* デバッグ用リセットボタン */}
        <button
          onClick={resetLocalStorage}
          className="fixed top-4 left-4 z-50 px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
        >
          リセット
        </button>
      </div>
    );
  }

  // ユーザー設定が表示されている間はメインコンテンツを非表示
  if (showUserSetup) {
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  const downloadSelectedReceiptImages = (expenses: ExpenseData[], selectedExpenseIds: string[]) => {
    const selectedExpensesData = expenses.filter((expense: ExpenseData) => selectedExpenseIds.includes(expense.id));
    if (selectedExpensesData.length === 0) {
      showError('ダウンロードするデータがありません', 'ダウンロードする経費を選択してください');
      return;
    }

    // 画像データがある経費のみをフィルタリング
    const expensesWithImages = selectedExpensesData.filter((expense: ExpenseData) => expense.imageData);
    
    if (expensesWithImages.length === 0) {
      showError('ダウンロード可能な画像がありません', '選択した経費に画像データが含まれていません');
      return;
    }

    // 各画像を個別にダウンロード
    expensesWithImages.forEach((expense: ExpenseData) => {
      if (expense.imageData) {
        const link = document.createElement('a');
        link.href = expense.imageData;
        link.download = `${expense.receiptNumber || expense.id}_${expense.date}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    showSuccess('画像ダウンロード完了', `${expensesWithImages.length}件の画像をダウンロードしました`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 particle-bg relative overflow-hidden">
      {/* パーティクルエフェクト */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-secondary-400 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-accent-400 rounded-full animate-float opacity-30" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-primary-300 rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* ヘッダー */}
      <header className="glass-strong shadow-glass border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              {/* Expenscanロゴ */}
              <ExpenscanLogo size="medium" />
              <div className="hidden sm:block">
                <p className="text-sm text-gray-300 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('header.subtitle')}</span>
                </p>
              </div>
            </div>
            
            {/* デスクトップ用エクスポートボタンと言語切り替え */}
            <div className="hidden lg:flex items-center space-x-3">
              {expenses.length > 0 && (
                <>
                  <button
                    onClick={handleExportAll}
                    className="btn-success flex items-center space-x-2 group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Download className="w-4 h-4 relative z-10 group-hover:animate-bounce" />
                    <span className="relative z-10">{t('header.exportAll')}</span>
                  </button>
                  {selectedExpenses.length > 0 && (
                    <>
                      <button
                        onClick={handleExportSelected}
                        className="btn-primary flex items-center space-x-2 group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download className="w-4 h-4 relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10">{t('header.exportSelected')}</span>
                      </button>
                      <button
                        onClick={() => downloadSelectedReceiptImages(expenses, selectedExpenses)}
                        className="btn-secondary flex items-center space-x-2 group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <ImageIcon className="w-4 h-4 relative z-10 group-hover:animate-pulse" />
                        <span className="relative z-10">{t('header.downloadImages')}</span>
                      </button>
                    </>
                  )}
                </>
              )}
              
              {/* 言語切り替え */}
              <LanguageSwitcher onLanguageChange={handleLanguageChange} />
            </div>

            {/* モバイル用言語切り替えとハンバーガーメニュー */}
            <div className="lg:hidden flex items-center space-x-3">
              {/* 言語切り替え（モバイル用） */}
              <LanguageSwitcher onLanguageChange={handleLanguageChange} />
              
              {/* ハンバーガーメニューボタン */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="hamburger-menu hamburger-button"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* デスクトップナビゲーション */}
      <nav className="glass shadow-glass border-b border-white/20 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    nav-tab whitespace-nowrap px-6 py-4 relative group transition-all duration-300 ease-in-out
                    ${isActive ? 'active' : 'hover:bg-gray-800/30 hover:scale-105'}
                  `}
                  title={tab.description}
                >
                  {/* アクティブ時の背景グラデーション */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-lg opacity-20`}></div>
                  )}
                  
                  {/* アイコンとテキスト */}
                  <div className="relative z-10 flex items-center">
                    <div className={`
                      p-2 rounded-lg transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                        : 'bg-gray-700/50 text-gray-300 group-hover:bg-gray-600/50 group-hover:text-white'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`ml-3 font-medium transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                  
                  {/* ホバー時のアンダーライン */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${tab.color}` 
                      : 'bg-transparent group-hover:bg-gray-400/50'
                    }
                  `}></div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className={`mobile-menu-content ${mobileMenuOpen ? 'open' : 'closed'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-900/90">
              <div className="flex items-center space-x-3">
                <ExpenscanLogo size="small" />
                <h2 className="text-lg font-semibold text-white">{t('navigation.menu')}</h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMobileTabChange(tab.id)}
                    className={`
                      mobile-nav-tab w-full relative group transition-all duration-300
                      ${isActive ? 'active' : 'hover:bg-gray-800/30'}
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* アクティブ時の背景グラデーション */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-10 rounded-lg`}></div>
                    )}
                    
                    {/* アイコンとテキスト */}
                    <div className="relative z-10 flex items-center space-x-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-300
                        ${isActive 
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                          : 'bg-gray-700/50 text-gray-300 group-hover:bg-gray-600/50 group-hover:text-white'
                        }
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-medium transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                    
                    {/* アクティブ時の左ボーダー */}
                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.color} rounded-r`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-8">
          {/* スマホ用統計情報 */}
          {userInfo && <MobileStatistics expenses={expenses} userInfo={userInfo} />}

          {/* デスクトップ用統計情報 */}
          {expenses.length > 0 && (
            <div className="hidden lg:block card animate-fade-in">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{t('statistics.title')}</h2>
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="stat-number relative z-10 group-hover:text-blue-300 transition-colors duration-300">{expenses.length}</div>
                      <div className="stat-label relative z-10">{t('statistics.registeredExpenses')}</div>
                    </div>
                  </div>
                  <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="stat-number relative z-10 group-hover:text-green-300 transition-colors duration-300">¥{totalAmount.toLocaleString()}</div>
                      <div className="stat-label relative z-10">{t('statistics.totalAmount')}</div>
                    </div>
                  </div>
                  <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="stat-number relative z-10 group-hover:text-orange-300 transition-colors duration-300">{selectedExpenses.length}</div>
                      <div className="stat-label relative z-10">{t('statistics.selected')}</div>
                    </div>
                  </div>
                  <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="stat-number relative z-10 group-hover:text-purple-300 transition-colors duration-300">¥{selectedAmount.toLocaleString()}</div>
                      <div className="stat-label relative z-10">{t('statistics.selectedAmount')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* タブコンテンツ */}
          <div className="animate-slide-in">
            {activeTab === 'upload' && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mt-8">
                  <h1 className="text-3xl font-bold text-white">{t('imageUpload.title')}</h1>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">{t('imageUpload.description')}</p>
                </div>
                <EnhancedImageUpload onOCRComplete={handleOCRComplete} />
              </div>
            )}

            {activeTab === 'batch' && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mt-8">
                  <h1 className="text-3xl font-bold text-white">{t('batchUpload.title')}</h1>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">{t('batchUpload.description')}</p>
                </div>
                <BatchUpload />
              </div>
            )}

            {activeTab === 'form' && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mt-8">
                  <h1 className="text-3xl font-bold text-white">{t('dataInput.title')}</h1>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">{t('dataInput.description')}</p>
                </div>
                <ExpenseForm />
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-8">
                <ExpenseList />
              </div>
            )}

            {activeTab === 'optimizer' && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mt-8">
                  <h1 className="text-3xl font-bold text-white">{t('budgetOptimizer.title')}</h1>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">{t('budgetOptimizer.description')}</p>
                </div>
                <BudgetOptimizer />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="glass shadow-glass border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            {/* フッターロゴ */}
            <div className="flex items-center justify-center">
              <ExpenscanLogo size="small" />
            </div>
            <p className="text-gray-300">
              © 2024 Expenscan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
} 
