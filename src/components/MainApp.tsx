'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Receipt, FileText, Calculator, Download, Plus, List, BarChart3, Settings, Sparkles, Upload, Menu, X, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import BatchUpload from '@/components/BatchUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserSetup from '@/components/UserSetup';
import MobileStatistics from '@/components/MobileStatistics';
import EnhancedImageUpload from '@/components/EnhancedImageUpload';
import ExpenscanLogo from '@/components/ExpenscanLogo';
import { useToast, ToastManager } from '@/components/Toast';
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';
import { t, getCurrentLanguage, Language } from '@/lib/i18n';
import { ExpenseData } from '@/types';

type TabType = 'upload' | 'batch' | 'form' | 'list' | 'optimizer';

interface UserInfo {
  email: string;
  targetMonth: string;
  budget: number;
}

interface MainAppProps {
  userInfo: UserInfo | null;
  onUserSetupComplete: (userData: UserInfo) => void;
}

export default function MainApp({ userInfo, onUserSetupComplete }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage());
  const { expenses, selectedExpenses, clearSelection, addExpense } = useExpenseStore();
  const { toasts, success, error, info, removeToast } = useToast();

  // メモ化された値
  const totalAmount = useMemo(() => 
    expenses.reduce((sum: number, exp: ExpenseData) => sum + exp.totalAmount, 0), 
    [expenses]
  );
  
  const selectedAmount = useMemo(() => 
    expenses
      .filter((exp: ExpenseData) => selectedExpenses.includes(exp.id))
      .reduce((sum: number, exp: ExpenseData) => sum + exp.totalAmount, 0),
    [expenses, selectedExpenses]
  );

  // メモ化されたタブ設定
  const tabs = useMemo(() => [
    {
      id: 'upload' as TabType,
      label: t('navigation.singleUpload', currentLanguage, '単一アップロード'),
      icon: Receipt,
      description: '',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'batch' as TabType,
      label: t('navigation.batchUpload', currentLanguage, '一括アップロード'),
      icon: Upload,
      description: t('batchUpload.description', currentLanguage, '複数のレシート画像を同時にアップロードできます'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'form' as TabType,
      label: t('navigation.dataEntry', currentLanguage, 'データ入力'),
      icon: FileText,
      description: t('expenseForm.description', currentLanguage, '経費情報を手動で入力・編集します'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'list' as TabType,
      label: t('navigation.expenseList', currentLanguage, '経費リスト'),
      icon: List,
      description: t('expenseList.description', currentLanguage, '登録された経費データの一覧と管理'),
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'optimizer' as TabType,
      label: t('navigation.budgetOptimizer', currentLanguage, '予算最適化'),
      icon: Calculator,
      description: t('budgetOptimizer.description', currentLanguage, '自動的に予算に最も近い経費の組み合わせを提案します'),
      color: 'from-indigo-500 to-purple-500'
    }
  ], [currentLanguage]);

  // デバッグ用：ローカルストレージリセット
  const resetLocalStorage = useCallback(() => {
    localStorage.removeItem('receipt_expense_manager_visited');
    localStorage.removeItem('user_info');
    window.location.reload();
  }, []);

  const handleExportAll = useCallback(() => {
    if (expenses.length === 0) {
      error('エクスポートするデータがありません', '経費データを追加してからエクスポートしてください');
      return;
    }
    exportExpensesToExcel(expenses, 'all_expenses.xlsx');
    success('エクスポート完了', `${expenses.length}件の経費データをエクスポートしました`);
  }, [expenses, error, success]);

  const handleExportSelected = useCallback(() => {
    if (selectedExpenses.length === 0) {
      error('エクスポートするデータがありません', 'エクスポートする経費を選択してください');
      return;
    }
    const selectedExpenseData = expenses.filter((expense: ExpenseData) => 
      selectedExpenses.includes(expense.id)
    );
    exportExpensesToExcel(selectedExpenseData, 'selected_expenses.xlsx');
    success('エクスポート完了', `${selectedExpenses.length}件の経費データをエクスポートしました`);
  }, [selectedExpenses, expenses, error, success]);

  // OCR完了後の自動遷移処理
  const handleOCRComplete = useCallback((ocrResult: any) => {
    // OCR結果をストアに追加
    if (ocrResult) {
      const expenseData: ExpenseData = {
        id: Date.now().toString(),
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        receiptDate: ocrResult.date || new Date().toISOString().split('T')[0],
        totalAmount: ocrResult.totalAmount || 0,
        category: ocrResult.category || '',
        description: ocrResult.description || '',
        taxRate: ocrResult.taxRate || 10,
        participantFromClient: ocrResult.participantFromClient || 0,
        participantFromCompany: ocrResult.participantFromCompany || 0,
        isQualified: ocrResult.isQualified || 'Qualified invoice/receipt',
        currency: ocrResult.currency || 'JPY',
        originalAmount: ocrResult.originalAmount || ocrResult.totalAmount || 0,
        originalCurrency: ocrResult.originalCurrency || 'JPY',
        convertedAmount: ocrResult.convertedAmount || ocrResult.totalAmount || 0,
        baseCurrency: ocrResult.baseCurrency || 'JPY',
        conversionRate: ocrResult.conversionRate || 1,
        conversionDate: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        rechargedToClient: ocrResult.rechargedToClient || 'N',
        gstVatApplicable: ocrResult.gstVatApplicable || 'N',
        companyName: ocrResult.companyName || '-',
        imageData: ocrResult.imageData || null,
        imageUrl: ocrResult.imageUrl || null,
        imageFileName: ocrResult.imageFileName || null,
        ocrText: ocrResult.ocrText || '',
        receiptNumber: ocrResult.receiptNumber || '',
      };
      
      addExpense(expenseData);
      success('OCR処理完了', '画像から経費情報を抽出しました。データ入力画面で詳細を確認してください。');
    }
    
    // データ入力画面に自動遷移
    setActiveTab('form');
  }, [addExpense, success]);

  // モバイルメニューのタブ切り替え
  const handleMobileTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }, []);

  // 言語切り替え
  const handleLanguageChange = useCallback((language: Language) => {
    setCurrentLanguage(language);
  }, []);

  const downloadSelectedReceiptImages = useCallback((expenses: ExpenseData[], selectedExpenseIds: string[]) => {
    const selectedExpensesData = expenses.filter((expense: ExpenseData) => selectedExpenseIds.includes(expense.id));
    if (selectedExpensesData.length === 0) {
      error('ダウンロードするデータがありません', 'ダウンロードする経費を選択してください');
      return;
    }

    // 画像データがある経費のみをフィルタリング
    const expensesWithImages = selectedExpensesData.filter((expense: ExpenseData) => expense.imageData);
    
    if (expensesWithImages.length === 0) {
      error('ダウンロード可能な画像がありません', '選択した経費に画像データが含まれていません');
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

    success('画像ダウンロード完了', `${expensesWithImages.length}件の画像をダウンロードしました`);
  }, [error, success]);

  // ユーザー設定が完了していない場合は設定画面を表示
  if (!userInfo) {
    return <UserSetup onSave={onUserSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ロゴ */}
            <div className="flex items-center space-x-4">
              <ExpenscanLogo size="medium" />
              <h1 className="text-xl font-semibold text-white hidden sm:block">
                {t('header.title', currentLanguage, 'Expenscan')}
              </h1>
            </div>

            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex items-center space-x-1">
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
                    {/* Active background gradient */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-lg opacity-20`}></div>
                    )}

                    {/* Icon and text */}
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

                    {/* Hover underline */}
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
            </nav>

            {/* 右側のコントロール */}
            <div className="flex items-center space-x-4">
              {/* 言語切り替え */}
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />

              {/* モバイルメニューボタン */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`mobile-menu-content ${mobileMenuOpen ? 'open' : 'closed'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-900/90">
              <div className="flex items-center space-x-3">
                <ExpenscanLogo size="small" />
                <h2 className="text-lg font-semibold text-white">{t('navigation.menu', currentLanguage, 'メニュー')}</h2>
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
                    {/* Active background gradient */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-10 rounded-lg`}></div>
                    )}

                    {/* Icon and text */}
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

                    {/* Active left border */}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード（デスクトップ） */}
        <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
          <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="stat-number relative z-10 group-hover:text-blue-300 transition-colors duration-300">{expenses.length}</div>
                              <div className="stat-label relative z-10">{t('statistics.registeredExpenses', currentLanguage, '登録済み経費')}</div>
            </div>
          </div>
          <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="stat-number relative z-10 group-hover:text-green-300 transition-colors duration-300">¥{totalAmount.toLocaleString()}</div>
                              <div className="stat-label relative z-10">{t('statistics.totalAmount', currentLanguage, '総金額')}</div>
            </div>
          </div>
          <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="stat-number relative z-10 group-hover:text-purple-300 transition-colors duration-300">¥{userInfo.budget.toLocaleString()}</div>
                              <div className="stat-label relative z-10">{t('statistics.myBudget', currentLanguage, '私の予算')}</div>
            </div>
          </div>
          <div className="stat-card group hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="stat-number relative z-10 group-hover:text-orange-300 transition-colors duration-300">¥{(userInfo.budget - totalAmount).toLocaleString()}</div>
                              <div className="stat-label relative z-10">{t('statistics.budgetDifference', currentLanguage, '予算差額')}</div>
            </div>
          </div>
        </div>

        {/* モバイル統計 */}
        <div className="md:hidden mb-6">
          <MobileStatistics
            expenses={expenses}
          userInfo={userInfo}
          />
        </div>

        {/* タブコンテンツ */}
        <div className="space-y-8">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                              <h2 className="text-3xl font-bold text-white mb-4 whitespace-nowrap">{t('navigation.singleUpload', currentLanguage, '単一アップロード')}</h2>

              </div>
              <EnhancedImageUpload onOCRComplete={handleOCRComplete} />
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-6">
              <div className="text-center">
                              <h2 className="text-3xl font-bold text-white mb-4 whitespace-nowrap">{t('navigation.batchUpload', currentLanguage, '一括アップロード')}</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{t('batchUpload.description', currentLanguage, '複数のレシート画像を同時にアップロードできます')}</p>
              </div>
              <BatchUpload />
            </div>
          )}

          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="text-center">
                              <h2 className="text-3xl font-bold text-white mb-4">{t('navigation.dataEntry', currentLanguage, 'データ入力')}</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{t('expenseForm.description', currentLanguage, '経費情報を手動で入力・編集します')}</p>
              </div>
              <ExpenseForm onSave={(data) => {
                addExpense(data);
                success('経費データを保存しました');
              }} />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-6">
                            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">{t('navigation.expenseList', currentLanguage, '経費リスト')}</h2>
              </div>
              
              {/* 選択された経費のアクション */}
              {selectedExpenses.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-400 font-medium animate-pulse">
                      {selectedExpenses.length}件選択中
                    </span>
                    <div className="flex items-center space-x-3 animate-slide-up">
                      <button
                        onClick={handleExportSelected}
                        className="btn-primary flex items-center space-x-2 group"
                      >
                        <Download className="w-4 h-4 group-hover:animate-bounce" />
                        <span>選択した経費をエクスポート</span>
                      </button>
                      <button
                        onClick={() => downloadSelectedReceiptImages(expenses, selectedExpenses)}
                        className="btn-secondary flex items-center space-x-2 group"
                      >
                        <ImageIcon className="w-4 h-4 group-hover:animate-pulse" />
                        <span>画像一括ダウンロード</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 全経費のアクション */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleExportAll}
                    className="btn-primary flex items-center space-x-2 group"
                  >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    <span>全経費をエクスポート</span>
                  </button>
                  <button
                    onClick={() => downloadSelectedReceiptImages(expenses, expenses.map(e => e.id))}
                    className="btn-secondary flex items-center space-x-2 group"
                  >
                    <ImageIcon className="w-4 h-4 group-hover:animate-pulse" />
                    <span>全画像をダウンロード</span>
                  </button>
                </div>
                
                {/* スマートフォンでは非表示 */}
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    onClick={clearSelection}
                    className="btn-ghost text-sm"
                  >
                    選択解除
                  </button>
                </div>
              </div>

              <ExpenseList />
            </div>
          )}

          {activeTab === 'optimizer' && (
            <div className="space-y-6">
              <div className="text-center">
                              <h2 className="text-3xl font-bold text-white mb-4">{t('navigation.budgetOptimizer', currentLanguage, '予算最適化')}</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">{t('budgetOptimizer.description', currentLanguage, '自動的に予算に最も近い経費の組み合わせを提案します')}</p>
              </div>
              <BudgetOptimizer />
            </div>
          )}
        </div>
      </main>

      {/* トースト通知 */}
              <ToastManager toasts={toasts} onClose={removeToast} />

      {/* デバッグ用リセットボタン */}
      <button
        onClick={resetLocalStorage}
        className="fixed bottom-4 left-4 z-50 px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
      >
        リセット
      </button>
    </div>
  );
} 
