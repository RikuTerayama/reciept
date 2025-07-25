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
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';
import { t, getCurrentLanguage, Language } from '@/lib/i18n';

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

  // 初回訪問チェックとユーザー情報チェック
  useEffect(() => {
    const hasVisited = localStorage.getItem('receipt_expense_manager_visited');
    const savedUserInfo = localStorage.getItem('user_info');
    
    if (hasVisited) {
      setShowWelcome(false);
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo);
          setUserInfo(parsed);
        } catch (error) {
          console.error('Failed to parse saved user info:', error);
          setShowUserSetup(true);
        }
      } else {
        setShowUserSetup(true);
      }
    } else {
      localStorage.setItem('receipt_expense_manager_visited', 'true');
    }
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setShowUserSetup(true);
  };

  const handleUserSetupComplete = (userData: UserInfo) => {
    setUserInfo(userData);
    setShowUserSetup(false);
  };

  const handleExportAll = () => {
    if (expenses.length === 0) {
      alert(t('expenseList.noData'));
      return;
    }
    exportExpensesToExcel(expenses, 'all_expenses.xlsx');
  };

  const handleExportSelected = () => {
    if (selectedExpenses.length === 0) {
      alert(t('expenseList.noData'));
      return;
    }
    const selectedExpenseData = expenses.filter(expense => 
      selectedExpenses.includes(expense.id)
    );
    exportExpensesToExcel(selectedExpenseData, 'selected_expenses.xlsx');
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

  const tabs = [
    { id: 'upload' as TabType, label: t('navigation.singleUpload'), icon: Receipt, description: t('imageUpload.description') },
    { id: 'batch' as TabType, label: t('navigation.batchUpload'), icon: Upload, description: t('batchUpload.description') },
    { id: 'form' as TabType, label: t('navigation.dataInput'), icon: Plus, description: t('dataInput.description') },
    { id: 'list' as TabType, label: t('navigation.expenseList'), icon: List, description: t('expenseList.description') },
    { id: 'optimizer' as TabType, label: t('navigation.budgetOptimizer'), icon: Calculator, description: t('budgetOptimizer.description') },
  ];

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const selectedAmount = expenses
    .filter(exp => selectedExpenses.includes(exp.id))
    .reduce((sum, exp) => sum + exp.totalAmount, 0);

  // ウェルカムスクリーンが表示されている間はメインコンテンツを非表示
  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // ユーザー設定が表示されている間はメインコンテンツを非表示
  if (showUserSetup) {
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  const downloadSelectedReceiptImages = (expenses: any[], selectedExpenseIds: string[]) => {
    const selectedExpensesData = expenses.filter(expense => selectedExpenseIds.includes(expense.id));
    if (selectedExpensesData.length === 0) {
      alert(t('expenseList.noData'));
      return;
    }

    // 画像データがある経費のみをフィルタリング
    const expensesWithImages = selectedExpensesData.filter(expense => expense.imageData);
    
    if (expensesWithImages.length === 0) {
      alert('ダウンロード可能な画像がありません。');
      return;
    }

    // 各画像を個別にダウンロード
    expensesWithImages.forEach(expense => {
      if (expense.imageData) {
        const link = document.createElement('a');
        link.href = expense.imageData;
        link.download = `${expense.receiptNumber || expense.id}_${expense.date}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
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
                    className="btn-success flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('header.exportAll')}</span>
                  </button>
                  {selectedExpenses.length > 0 && (
                    <>
                      <button
                        onClick={handleExportSelected}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('header.exportSelected')}</span>
                      </button>
                      <button
                        onClick={() => downloadSelectedReceiptImages(expenses, selectedExpenses)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>{t('header.downloadImages')}</span>
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
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    nav-tab whitespace-nowrap px-6 py-4
                    ${activeTab === tab.id ? 'active' : ''}
                  `}
                  title={tab.description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-2">{tab.label}</span>
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
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">{t('navigation.menu')}</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMobileTabChange(tab.id)}
                    className={`
                      mobile-nav-tab w-full
                      ${activeTab === tab.id ? 'active' : ''}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
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
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{t('statistics.title')}</h2>
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="stat-card">
                    <div className="stat-number">{expenses.length}</div>
                    <div className="stat-label">{t('statistics.registeredExpenses')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">¥{totalAmount.toLocaleString()}</div>
                    <div className="stat-label">{t('statistics.totalAmount')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{selectedExpenses.length}</div>
                    <div className="stat-label">{t('statistics.selected')}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">¥{selectedAmount.toLocaleString()}</div>
                    <div className="stat-label">{t('statistics.selectedAmount')}</div>
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
    </div>
  );
} 
