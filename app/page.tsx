'use client';

import React, { useState } from 'react';
import { Receipt, FileText, Calculator, Download, Plus, List } from 'lucide-react';
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

  const tabs = [
    { id: 'upload' as TabType, label: '画像アップロード', icon: Receipt },
    { id: 'form' as TabType, label: 'データ入力', icon: Plus },
    { id: 'list' as TabType, label: '経費リスト', icon: List },
    { id: 'optimizer' as TabType, label: '予算最適化', icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Receipt className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">
                レシート経費管理システム
              </h1>
            </div>
            
            {/* エクスポートボタン */}
            <div className="flex items-center space-x-2">
              {expenses.length > 0 && (
                <>
                  <button
                    onClick={handleExportAll}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>全件出力</span>
                  </button>
                  {selectedExpenses.length > 0 && (
                    <button
                      onClick={handleExportSelected}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 統計情報 */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">統計情報</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{expenses.length}</div>
                  <div className="text-sm text-blue-700">登録済み経費</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ¥{expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">総金額</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedExpenses.length}</div>
                  <div className="text-sm text-orange-700">選択済み</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ¥{expenses
                      .filter(exp => selectedExpenses.includes(exp.id))
                      .reduce((sum, exp) => sum + exp.totalAmount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">選択金額</div>
                </div>
              </div>
            </div>
          )}

          {/* タブコンテンツ */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  レシート画像をアップロード
                </h2>
                <p className="text-gray-600">
                  OCR技術を使用して画像から経費情報を自動抽出します
                </p>
              </div>
              <ImageUpload />
            </div>
          )}

          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  経費データ入力・編集
                </h2>
                <p className="text-gray-600">
                  OCR結果を確認し、必要に応じて手動で修正してください
                </p>
              </div>
              <ExpenseForm />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    経費リスト
                  </h2>
                  <p className="text-gray-600">
                    登録された経費データの一覧と管理
                  </p>
                </div>
                {selectedExpenses.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    選択解除
                  </button>
                )}
              </div>
              <ExpenseList />
            </div>
          )}

          {activeTab === 'optimizer' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  予算最適化エンジン
                </h2>
                <p className="text-gray-600">
                  指定された予算に最も近い経費の組み合わせを自動提案します
                </p>
              </div>
              <BudgetOptimizer />
            </div>
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 レシート経費管理システム. All rights reserved.</p>
            <p className="text-sm mt-2">
              Next.js + Tesseract.js + TailwindCSS で構築
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
