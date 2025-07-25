'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Download, Image as ImageIcon, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { ExpenseData } from '@/types';

interface OptimizationResult {
  id: string;
  expenses: ExpenseData[];
  totalAmount: number;
  difference: number;
  score: number;
}

export default function BudgetOptimizer() {
  const { expenses } = useExpenseStore();
  const [targetBudget, setTargetBudget] = useState(100000);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const budgetTargets = [100000, 150000, 200000];

  // 予算最適化アルゴリズム
  const optimizeBudget = (target: number): OptimizationResult[] => {
    const results: OptimizationResult[] = [];
    const n = expenses.length;
    
    // 全組み合わせを生成（最大10個の経費まで）
    const maxCombinations = Math.min(10, n);
    
    for (let size = 1; size <= maxCombinations; size++) {
      const combinations = generateCombinations(expenses, size);
      
      combinations.forEach((combination, index) => {
        const totalAmount = combination.reduce((sum, exp) => sum + exp.totalAmount, 0);
        const difference = Math.abs(target - totalAmount);
        const score = 1 / (1 + difference / target); // 0-1のスコア
        
        results.push({
          id: `${size}-${index}`,
          expenses: combination,
          totalAmount,
          difference,
          score
        });
      });
    }
    
    // スコアでソート（上位10件）
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  };

  // 組み合わせ生成
  const generateCombinations = (items: ExpenseData[], size: number): ExpenseData[][] => {
    if (size === 0) return [[]];
    if (items.length === 0) return [];
    
    const [first, ...rest] = items;
    const withoutFirst = generateCombinations(rest, size);
    const withFirst = generateCombinations(rest, size - 1).map(combo => [first, ...combo]);
    
    return [...withoutFirst, ...withFirst];
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    
    // 最適化処理を非同期で実行
    setTimeout(() => {
      const results = optimizeBudget(targetBudget);
      setOptimizationResults(results);
      setIsOptimizing(false);
    }, 1000);
  };

  const handleDownloadImages = (result: OptimizationResult) => {
    const expensesWithImages = result.expenses.filter(expense => expense.imageData);
    
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

  const handleDownloadAllImages = () => {
    const allExpenses = optimizationResults.flatMap(result => result.expenses);
    const uniqueExpenses = allExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.id === expense.id)
    );
    
    const expensesWithImages = uniqueExpenses.filter(expense => expense.imageData);
    
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
    <div className="space-y-8">
      {/* 最適化設定 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">予算最適化</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <div>
              <label className="form-label">目標予算</label>
              <div className="flex space-x-4">
                {budgetTargets.map(budget => (
                  <button
                    key={budget}
                    onClick={() => setTargetBudget(budget)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      targetBudget === budget
                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    ¥{budget.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleOptimize}
              disabled={expenses.length === 0 || isOptimizing}
              className="btn-primary flex items-center space-x-2"
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>最適化中...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>最適化実行</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 最適化結果 */}
      {optimizationResults.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">最適化結果</h3>
              <button
                onClick={handleDownloadAllImages}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>全画像ダウンロード</span>
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {optimizationResults.map((result, index) => (
                <div key={result.id} className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-full">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            組み合わせ {index + 1}
                          </h4>
                          <p className="text-sm text-gray-300">
                            スコア: {(result.score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          ¥{result.totalAmount.toLocaleString()}
                        </div>
                        <div className={`text-sm ${result.difference === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                          差額: ¥{result.difference.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* 経費リスト */}
                    <div className="space-y-2 mb-4">
                      {result.expenses.map(expense => (
                        <div key={expense.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-gray-300" />
                            </div>
                            <div>
                              <p className="text-white text-sm">{expense.receiptNumber || expense.id}</p>
                              <p className="text-gray-300 text-xs">{expense.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm">¥{expense.totalAmount.toLocaleString()}</p>
                            <p className="text-gray-300 text-xs">{expense.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDownloadImages(result)}
                        className="btn-secondary flex items-center space-x-1 text-xs"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>画像ダウンロード</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 経費データがない場合 */}
      {expenses.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-full mb-4">
              <Calculator className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">経費データがありません</h3>
            <p className="text-gray-300">
              最適化するには、まず経費データを登録してください
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
