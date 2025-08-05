'use client';

import React, { useState } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { optimizeBudget } from '@/lib/optimizer';
import { exportBudgetOptimizationToExcel } from '@/lib/excel';

interface BudgetOptimizerProps {
  hideTitle?: boolean;
}

export default function BudgetOptimizer({ hideTitle }: BudgetOptimizerProps) {
  const [targetBudget, setTargetBudget] = useState(100000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const { expenses } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  const handleOptimize = async () => {
    if (expenses.length === 0) {
      alert(t('budgetOptimizer.noExpenses', currentLanguage, '経費データがありません'));
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeBudget(expenses, targetBudget);
      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization error:', error);
      alert(t('common.error', currentLanguage, 'エラーが発生しました'));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExport = () => {
    if (!optimizationResult || !optimizationResult.selectedExpenses || optimizationResult.selectedExpenses.length === 0) {
      alert(t('budgetOptimizer.noResults', currentLanguage, '最適化結果がありません'));
      return;
    }

    try {
      const filename = `budget_optimization_${new Date().toISOString().split('T')[0]}.xlsx`;
      exportBudgetOptimizationToExcel(
        expenses, // 元の経費データ
        optimizationResult.selectedExpenses, // 最適化された経費データ
        targetBudget, // 目標予算
        filename
      );
      alert(t('common.success', currentLanguage, '成功しました'));
    } catch (error) {
      console.error('Export error:', error);
      alert(t('common.error', currentLanguage, 'エラーが発生しました'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 設定セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        {!hideTitle && (
          <h3 className="text-lg font-semibold mb-4 text-center">{t('budgetOptimizer.title', currentLanguage, '予算最適化')}</h3>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-center">{t('budgetOptimizer.targetBudget', currentLanguage, '目標予算')}</label>
            <input
              type="number"
              value={targetBudget}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
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
              {isOptimizing ? t('common.loading', currentLanguage, '処理中...') : t('budgetOptimizer.optimize', currentLanguage, '最適化実行')}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400 text-center">
          {t('budgetOptimizer.availableExpenses', currentLanguage, '利用可能な経費')}: {expenses.length} {t('common.items', currentLanguage, '件')}
        </div>
      </div>

      {/* 結果セクション */}
      {optimizationResult && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-center">{t('budgetOptimizer.results', currentLanguage, '最適化結果')}</h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('common.export', currentLanguage, 'エクスポート')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                ¥{optimizationResult.totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.totalAmount', currentLanguage, '総金額')}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                ¥{(targetBudget - optimizationResult.totalAmount).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.difference', currentLanguage, '予算差額')}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {optimizationResult.selectedExpenses.length}
              </div>
              <div className="text-sm text-gray-400">{t('budgetOptimizer.selectedExpenses', currentLanguage, '選択された経費')}</div>
            </div>
          </div>

          {/* 選択された経費一覧 */}
          <div className="space-y-2">
            <h4 className="font-medium text-center">{t('budgetOptimizer.selectedExpenses', currentLanguage, '選択された経費')}</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {optimizationResult.selectedExpenses.map((expense: any) => (
                <div key={expense.id} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex-1 text-left">
                    <div className="font-medium">{expense.date}</div>
                    <div className="text-sm text-gray-400">{expense.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
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
        <h3 className="text-lg font-semibold mb-4 text-center">{t('statistics.title', currentLanguage, '統計情報')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {expenses.length}
            </div>
            <div className="text-sm text-gray-400">{t('statistics.registeredExpenses', currentLanguage, '登録済み経費')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ¥{expenses.reduce((sum, expense) => sum + expense.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">{t('statistics.totalAmount', currentLanguage, '総金額')}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 
