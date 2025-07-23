'use client';

import React, { useState } from 'react';
import { Receipt, FileText, Calculator, Download, Plus, List, BarChart3, Settings, Sparkles } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';

type TabType = 'upload' | 'form' | 'list' | 'optimizer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const { expenses, selectedExpenses, clearSelection } = useExpenseStore();

  const handleExportAll = () => {
    if (expenses.length === 0) {
      alert('エクスポートする経費データがありません。');
      return;
    }
    exportExpensesToExcel(expenses, 'all_expenses.xlsx');
  };

  const handleExportSelected = () => {
    if (selectedExpenses.length === 0) {
      alert('エクスポートする経費を選択してください。');
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

  const tabs = [
    { id: 'upload' as TabType, label: '画像アップロード', icon: Receipt, description: 'レシート画像をアップロード' },
    { id: 'form' as TabType, label: 'データ入力', icon: Plus, description: '経費データを入力・編集' },
    { id: 'list' as TabType, label: '経費リスト', icon: List, description: '登録済み経費の管理' },
    { id: 'optimizer' as TabType, label: '予算最適化', icon: Calculator, description: '最適な組み合わせを提案' },
  ];

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const selectedAmount = expenses
    .filter(exp => selectedExpenses.includes(exp.id))
    .reduce((sum, exp) => sum + exp.totalAmount, 0);

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
                  レシート経費管理システム
                </h1>
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>OCR技術による自動抽出・管理</span>
                </p>
              </div>
            </div>
            
            {/* エクスポートボタン */}
            <div className="flex items-center space-x-3">
              {expenses.length > 0 && (
                <>
                  <button
                    onClick={handleExportAll}
                    className="btn-success flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>全件出力</span>
                  </button>
                  {selectedExpenses.length > 0 && (
                    <button
                      onClick={handleExportSelected}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>選択出力</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="glass shadow-glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    nav-tab
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
                  <h2 className="text-xl font-semibold text-gray-900">統計情報</h2>
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="stat-card">
                    <div className="stat-number">{expenses.length}</div>
                    <div className="stat-label">登録済み経費</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">¥{totalAmount.toLocaleString()}</div>
                    <div className="stat-label">総金額</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{selectedExpenses.length}</div>
                    <div className="stat-label">選択済み</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">¥{selectedAmount.toLocaleString()}</div>
                    <div className="stat-label">選択金額</div>
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
                      レシート画像をアップロード
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      OCR技術を使用して画像から経費情報を自動抽出します。
                      JPEG、PNG、GIF、BMP、PDFファイルに対応しています。
                    </p>
                  </div>
                </div>
                <ImageUpload onOCRComplete={handleOCRComplete} />
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
                      経費データ入力・編集
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      OCR結果を確認し、必要に応じて手動で修正してください。
                      すべての項目を正確に入力することで、より良い分析が可能になります。
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
                          経費リスト
                        </h2>
                        <p className="text-lg text-gray-600">
                          登録された経費データの一覧と管理
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
                      <span>選択解除</span>
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
                      予算最適化エンジン
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      指定された予算に最も近い経費の組み合わせを自動提案します。
                      効率的な予算管理にお役立てください。
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
                レシート経費管理システム
              </p>
            </div>
            <p className="text-gray-600">
              © 2025 レシート経費管理システム. Developed by RT. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
              <span>Next.js + Tesseract.js + TailwindCSS で構築</span>
              <Sparkles className="w-3 h-3" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
