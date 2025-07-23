'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Target, TrendingUp, Download, AlertCircle } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { findOptimalExpenseCombination } from '@/lib/optimizer';
import { exportBudgetOptimizationToExcel } from '@/lib/excel';
import { BUDGET_OPTIONS, OptimizedExpense } from '@/types';

export default function BudgetOptimizer() {
  const { expenses } = useExpenseStore();
  const [selectedBudget, setSelectedBudget] = useState<number>(100000);
  const [customBudget, setCustomBudget] = useState<string>('');
  const [optimizedResult, setOptimizedResult] = useState<OptimizedExpense | null>(null);

  const handleOptimize = () => {
    if (expenses.length === 0) {
      alert('最適化する経費データがありません。');
      return;
    }

    const budget = customBudget ? parseInt(customBudget) : selectedBudget;
    if (isNaN(budget) || budget <= 0) {
      alert('有効な予算を入力してください。');
      return;
    }

    const result = findOptimalExpenseCombination(expenses, budget);
    setOptimizedResult(result);
  };

  const handleExport = () => {
    if (!optimizedResult) {
      alert('エクスポートする最適化結果がありません。');
      return;
    }

    const budget = customBudget ? parseInt(customBudget) : selectedBudget;
    exportBudgetOptimizationToExcel(
      expenses,
      optimizedResult.expenses,
      budget,
      `budget_optimization_${budget.toLocaleString()}.xlsx`
    );
  };

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, exp) => sum + exp.totalAmount, 0), 
    [expenses]
  );

  const averageExpense = useMemo(() => 
    expenses.length > 0 ? totalExpenses / expenses.length : 0, 
    [expenses, totalExpenses]
  );

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Calculator className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">経費データがありません</h3>
          <p className="text-gray-500">
            最適化する経費データを追加してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-number">{expenses.length}</div>
          <div className="stat-label">利用可能な経費</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">¥{totalExpenses.toLocaleString()}</div>
          <div className="stat-label">総金額</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">¥{Math.round(averageExpense).toLocaleString()}</div>
          <div className="stat-label">平均金額</div>
        </div>
      </div>

      {/* 予算設定 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">予算設定</h2>
          </div>
        </div>
        <div className="card-body space-y-6">
          {/* プリセット予算 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">プリセット予算</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedBudget(option.amount);
                    setCustomBudget('');
                  }}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${selectedBudget === option.amount && !customBudget
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-semibold text-lg">{option.label}</div>
                  <div className="text-sm text-gray-600">¥{option.amount.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* カスタム予算 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">カスタム予算</h3>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={customBudget}
                onChange={(e) => {
                  setCustomBudget(e.target.value);
                  setSelectedBudget(0);
                }}
                placeholder="予算を入力してください"
                className="form-input flex-1"
                min="1"
                max="10000000"
              />
              <span className="text-gray-500">円</span>
            </div>
          </div>

          {/* 最適化ボタン */}
          <div className="flex justify-center">
            <button
              onClick={handleOptimize}
              className="btn-primary flex items-center space-x-2"
            >
              <TrendingUp className="w-5 h-5" />
              <span>最適化実行</span>
            </button>
          </div>
        </div>
      </div>

      {/* 最適化結果 */}
      {optimizedResult && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">最適化結果</h2>
              </div>
              <button
                onClick={handleExport}
                className="btn-success flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>エクスポート</span>
              </button>
            </div>
          </div>
          <div className="card-body space-y-6">
            {/* 結果サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="stat-number">
                  ¥{(customBudget ? parseInt(customBudget) : selectedBudget).toLocaleString()}
                </div>
                <div className="stat-label">目標予算</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  ¥{optimizedResult.totalAmount.toLocaleString()}
                </div>
                <div className="stat-label">最適化後合計</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  ¥{optimizedResult.difference.toLocaleString()}
                </div>
                <div className="stat-label">差額</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {optimizedResult.expenses.length}
                </div>
                <div className="stat-label">選択経費数</div>
              </div>
            </div>

            {/* 選択された経費リスト */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">選択された経費</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>日付</th>
                      <th>金額</th>
                      <th>カテゴリ</th>
                      <th>部署</th>
                      <th>適格区分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimizedResult.expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td>{expense.date}</td>
                        <td className="font-medium">
                          ¥{expense.totalAmount.toLocaleString()}
                        </td>
                        <td>{expense.category}</td>
                        <td>{expense.department}</td>
                        <td>{expense.isQualified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 効率性指標 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">i</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-700">最適化効率</h4>
                  <div className="text-sm text-blue-600 mt-1 space-y-1">
                    <p>• 予算使用率: {((optimizedResult.totalAmount / (customBudget ? parseInt(customBudget) : selectedBudget)) * 100).toFixed(1)}%</p>
                    <p>• 平均単価: ¥{Math.round(optimizedResult.totalAmount / optimizedResult.expenses.length).toLocaleString()}</p>
                    <p>• 選択効率: {((optimizedResult.expenses.length / expenses.length) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヒント */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-700">最適化アルゴリズムについて</h4>
            <ul className="text-sm text-yellow-600 mt-1 space-y-1">
              <li>• 動的計画法を使用して最適な組み合わせを計算</li>
              <li>• 予算を超えない範囲で最大の価値を提供</li>
              <li>• 複数の経費の組み合わせを考慮</li>
              <li>• 結果は即座に計算され、リアルタイムで表示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
