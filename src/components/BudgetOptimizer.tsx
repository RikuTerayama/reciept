'use client';

import React, { useState } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { optimizeBudget } from '@/lib/optimizer';
import { exportBudgetOptimizationToExcel } from '@/lib/excel';

export default function BudgetOptimizer() {
  const [targetBudget, setTargetBudget] = useState(100000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const { expenses } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  const handleOptimize = async () => {
    if (expenses.length === 0) {
      alert(t('budgetOptimizer.noExpenses', currentLanguage));
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeBudget(expenses, targetBudget);
      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization error:', error);
      alert(t('common.error', currentLanguage));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExport = () => {
    if (!optimizationResult) {
      alert(t('budgetOptimizer.noResults', currentLanguage));
      return;
    }

    try {
      const filename = `budget_optimization_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportBudgetOptimizationToExcel(optimizationResult.selectedExpenses, filename);
      alert(t('common.success', currentLanguage));
    } catch (error) {
      console.error('Export error:', error);
      alert(t('common.error', currentLanguage));
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* 設定セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('budgetOptimizer.title', currentLanguage)}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('budgetOptimizer.targetBudget', currentLanguage)}</label>
            <input
              type="number"
              value={targetBudget}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              min="0"
              step="1000"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || expenses.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? t('common.loading', currentLanguage) : t('budgetOptimizer.optimize', currentLanguage)}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          {t('budgetOptimizer.availableExpenses', currentLanguage)}: {expenses.length} {t('common.items', currentLanguage)}
        </div>
      </div>

      {/* 結果セクション */}
      {optimizationResult && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('budgetOptimizer.results', currentLanguage)}</h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('common.export', currentLanguage)}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                ¥{optimizationResult.totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.totalAmount', currentLanguage)}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                ¥{(targetBudget - optimizationResult.totalAmount).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.difference', currentLanguage)}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">
                {optimizationResult.selectedExpenses.length}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.selectedExpenses', currentLanguage)}</div>
            </div>
          </div>

          {/* 選択された経費一覧 */}
          <div className="space-y-2">
            <h4 className="font-medium">{t('budgetOptimizer.selectedExpenses', currentLanguage)}</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {optimizationResult.selectedExpenses.map((expense: any) => (
                <div key={expense.id} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{expense.date}</div>
                    <div className="text-sm text-gray-400">{expense.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">¥{expense.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">{expense.currency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('statistics.title', currentLanguage)}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {expenses.length}
            </div>
            <div className="text-sm text-gray-400">{t('statistics.registeredExpenses', currentLanguage)}</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-400">
              ¥{expenses.reduce((sum, expense) => sum + expense.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">{t('statistics.totalAmount', currentLanguage)}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 
