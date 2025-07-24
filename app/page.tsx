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
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';
import { t, getCurrentLanguage, Language } from '@/lib/i18n';

type TabType = 'upload' | 'batch' | 'form' | 'list' | 'optimizer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [showWelcome, setShowWelcome] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage());
  const { expenses, selectedExpenses, clearSelection } = useExpenseStore();

  // 初回訪問チェック
  useEffect(() => {
    const hasVisited = localStorage.getItem('receipt_expense_manager_visited');
    if (hasVisited) {
      setShowWelcome(false);
    } else {
      localStorage.setItem('receipt_expense_manager_visited', 'true');
    }
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 particle-bg relative overflow-hidden">
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
              <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg neon-glow">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  {t('header.title')}
                </h1>
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{t('header.subtitle')}</span>
                </p>
              </div>
            </div>
            
            {/* エクスポートボタンと言語切り替え */}
            <div className="flex items-center space-x-3">
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
          <div className="flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    nav-tab whitespace-nowrap
                    ${activeTab === tab.id ? 'active' : ''}
                  `}
                  title={tab.description}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
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
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('navigation.menu')}</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
          {/* 統計情報 */}
          {expenses.length > 0 && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('statistics.title')}</h2>
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
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl shadow-2xl neon-glow animate-float">
                    <Receipt className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      {t('imageUpload.title')}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {t('imageUpload.description')}
                    </p>
                  </div>
                </div>
                <ImageUpload onOCRComplete={handleOCRComplete} />
              </div>
            )}

            {activeTab === 'batch' && (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-2xl neon-glow animate-float">
                    <Upload className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      {t('batchUpload.title')}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {t('batchUpload.description')}
                    </p>
                  </div>
                </div>
                <BatchUpload />
              </div>
            )}

            {activeTab === 'form' && (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl shadow-2xl neon-glow animate-float">
                    <Plus className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      {t('dataInput.title')}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {t('dataInput.description')}
                    </p>
                  </div>
                </div>
                <ExpenseForm />
              </div>
            )}

            {activeTab === 'list' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg neon-glow">
                        <List className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold text-gray-900">
                          {t('expenseList.title')}
                        </h2>
                        <p className="text-lg text-gray-600">
                          {t('expenseList.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedExpenses.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('common.clearSelection')}</span>
                    </button>
                  )}
                </div>
                <ExpenseList />
              </div>
            )}

            {activeTab === 'optimizer' && (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-2xl neon-glow animate-float">
                    <Calculator className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                      {t('budgetOptimizer.title')}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {t('budgetOptimizer.description')}
                    </p>
                  </div>
                </div>
                <BudgetOptimizer />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="glass-strong shadow-glass border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <p className="text-xl font-semibold gradient-text">
                {t('header.title')}
              </p>
            </div>
            <p className="text-gray-600">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
