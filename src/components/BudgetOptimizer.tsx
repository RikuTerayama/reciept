'use client';

import React, { useState } from 'react';
import { Calculator, Download, Target } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { BUDGET_OPTIONS } from '@/types';
import { findOptimalExpenseCombination } from '@/lib/optimizer';
import { exportOptimizedExpenseToExcel } from '@/lib/excel';

export default function BudgetOptimizer() {
  const { expenses, setOptimizedExpense, optimizedExpense } = useExpenseStore();
  const [selectedBudget, setSelectedBudget] = useState(BUDGET_OPTIONS[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleOptimize = () => {
    if (expenses.length === 0) {
      alert('経費データがありません。まず経費を追加してください。');
      return;
    }

    setIsCalculating(true);
    
    // 非同期処理をシミュレート
    setTimeout(() => {
      const result = findOptimalExpenseCombination(expenses, selectedBudget.amount);
      setOptimizedExpense(result);
      setIsCalculating(false);
    }, 1000);
  };

  const handleExport = () => {
    if (!optimizedExpense) {
      alert('最適化結果がありません。');
      return;
    }

    const filename = `optimized_expenses_${selectedBudget.amount.toLocaleString()}.xlsx`;
    exportOptimizedExpenseToExcel(optimizedExpense, selectedBudget.amount, filename);
  };

  const totalExpenseAmount = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold">予算最適化エンジン</h2>
      </div>

      {/* 予算選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          目標予算を選択してください
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUDGET_OPTIONS.map((budget) => (
            <button
              key={budget.id}
              onClick={() => setSelectedBudget(budget)}
              className={`
                p-4 border-2 rounded-lg text-center transition-colors
                ${selectedBudget.id === budget.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-primary-400'
                }
              `}
            >
              <div className="text-lg font-semibold">{budget.label}</div>
              <div className="text-sm text-gray-600">¥{budget.amount.toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 現在の経費状況 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">現在の経費状況</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">登録済み経費</p>
            <p className="font-medium">{expenses.length}件</p>
          </div>
          <div>
            <p className="text-gray-500">総金額</p>
            <p className="font-medium">¥{totalExpenseAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">目標予算</p>
            <p className="font-medium">¥{selectedBudget.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">差額</p>
            <p className={`font-medium ${totalExpenseAmount > selectedBudget.amount ? 'text-red-600' : 'text-green-600'}`}>
              ¥{(totalExpenseAmount - selectedBudget.amount).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 最適化実行ボタン */}
      <div className="mb-6">
        <button
          onClick={handleOptimize}
          disabled={isCalculating || expenses.length === 0}
          className={`
            w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-colors
            ${isCalculating || expenses.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }
          `}
        >
          {isCalculating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>最適化中...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>最適化実行</span>
            </div>
          )}
        </button>
      </div>

      {/* 最適化結果 */}
      {optimizedExpense && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-primary-700">最適化結果</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {optimizedExpense.expenses.length}
                </div>
                <div className="text-sm text-green-700">選択された経費数</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ¥{optimizedExpense.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">合計金額</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ¥{optimizedExpense.difference.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">予算との差額</div>
              </div>
            </div>

            {/* 選択された経費リスト */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">選択された経費</h4>
              <div className="space-y-2">
                {optimizedExpense.expenses.map((expense, index) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <div className="text-sm font-medium">{expense.category}</div>
                        <div className="text-xs text-gray-500">{expense.date} - {expense.department}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">¥{expense.totalAmount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* エクスポートボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel出力</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヒント */}
      {expenses.length > 0 && !optimizedExpense && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-700">ヒント</h4>
              <p className="text-sm text-blue-600 mt-1">
                最適化エンジンは、選択された予算に最も近い経費の組み合わせを自動で見つけます。
                効率的な予算管理にお役立てください。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
