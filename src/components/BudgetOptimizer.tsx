'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { optimizeBudget } from '@/lib/optimizer';
import { exportBudgetOptimizationToExcel } from '@/lib/excel';
import { generateBudgetOptimizationImages, saveBudgetOptimizationImages, downloadImage, downloadMultipleImagesAsZip, BudgetOptimizationImage } from '@/lib/imageStorage';
import { ImageIcon, X, FolderOpen, Download } from 'lucide-react';

interface BudgetOptimizerProps {
  hideTitle?: boolean;
  activeMonth?: string; // 対象月（YYYY-MM形式）
}

export default function BudgetOptimizer({ hideTitle, activeMonth }: BudgetOptimizerProps) {
  const [targetBudget, setTargetBudget] = useState(100000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizationImages, setOptimizationImages] = useState<BudgetOptimizationImage[]>([]);
  const [showImageManager, setShowImageManager] = useState(false);
  const { expenses } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  // 対象月でフィルタリング
  const monthFilteredExpenses = activeMonth 
    ? expenses.filter(exp => exp.monthKey === activeMonth)
    : expenses;

  const handleOptimize = async () => {
    if (monthFilteredExpenses.length === 0) {
      alert(t('budgetOptimizer.noExpenses', currentLanguage, '対象月の経費データがありません'));
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeBudget(monthFilteredExpenses, targetBudget);
      setOptimizationResult(result);
      
      // 最適化結果から画像リストを生成
      if (result.selectedExpenses && result.selectedExpenses.length > 0) {
        const expenseIds = result.selectedExpenses.map((exp: any) => exp.id);
        const budgetNumbers = result.selectedExpenses.map((exp: any, index: number) => index + 1);
        const images = generateBudgetOptimizationImages(expenseIds, budgetNumbers);
        setOptimizationImages(images);
        saveBudgetOptimizationImages(images);
      }
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
    <div className="space-y-4 md:space-y-6">
      {/* 設定セクション */}
      <div className="bg-gray-800 rounded-lg p-4 md:p-6">
        {!hideTitle && (
          <h3 className="text-base md:text-lg font-semibold mb-4 text-center">{t('budgetOptimizer.title', currentLanguage, '予算最適化')}</h3>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-center">{t('budgetOptimizer.targetBudget', currentLanguage, '目標予算')}</label>
            <input
              type="number"
              value={targetBudget}
              onChange={(e) => setTargetBudget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-sm"
              min="0"
              step="1000"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || expenses.length === 0}
              className="w-full px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isOptimizing ? t('common.loading', currentLanguage, '処理中...') : t('budgetOptimizer.optimize', currentLanguage, '最適化実行')}
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs md:text-sm text-gray-400 text-center">
          {t('budgetOptimizer.availableExpenses', currentLanguage, '利用可能な経費')}: {monthFilteredExpenses.length} {t('common.items', currentLanguage, '件')}
          {activeMonth && (
            <div className="text-xs text-blue-400 mt-1">
              {activeMonth} の経費のみ表示
            </div>
          )}
        </div>
        
        {/* 画像管理ボタン */}
        {optimizationImages.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowImageManager(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <ImageIcon className="w-4 h-4" />
              {t('budgetOptimizer.manageImages', currentLanguage, '画像管理')} ({optimizationImages.length})
            </button>
          </div>
        )}
      </div>

      {/* 結果セクション */}
      {optimizationResult && (
        <div className="bg-gray-800 rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-semibold text-center">{t('budgetOptimizer.results', currentLanguage, '最適化結果')}</h3>
            <button
              onClick={handleExport}
              className="px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
            >
              {t('common.export', currentLanguage, 'エクスポート')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-400">
                ¥{optimizationResult.totalAmount.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-400">{t('budgetOptimizer.totalAmount', currentLanguage, '総金額')}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-green-400">
                ¥{(targetBudget - optimizationResult.totalAmount).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-gray-400">{t('budgetOptimizer.difference', currentLanguage, '予算差額')}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-purple-400">
                {optimizationResult.selectedExpenses.length}
              </div>
              <div className="text-xs md:text-sm text-gray-400">{t('budgetOptimizer.selectedExpenses', currentLanguage, '選択された経費')}</div>
            </div>
          </div>

          {/* 選択された経費一覧 */}
          <div className="space-y-2">
            <h4 className="font-medium text-center text-sm md:text-base">{t('budgetOptimizer.selectedExpenses', currentLanguage, '選択された経費')}</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {optimizationResult.selectedExpenses.map((expense: any) => (
                <div key={expense.id} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm md:text-base">{expense.date}</div>
                    <div className="text-xs md:text-sm text-gray-400">{expense.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-medium text-sm md:text-base">¥{expense.totalAmount.toLocaleString()}</div>
                    <div className="text-xs md:text-sm text-gray-400">{expense.currency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <div className="bg-gray-800 rounded-lg p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4 text-center">{t('statistics.title', currentLanguage, '統計情報')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-400">
              {expenses.length}
            </div>
            <div className="text-xs md:text-sm text-gray-400">{t('statistics.registeredExpenses', currentLanguage, '登録済み経費')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-green-400">
              ¥{expenses.reduce((sum, expense) => sum + expense.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-400">{t('statistics.totalAmount', currentLanguage, '総金額')}</div>
          </div>
        </div>
      </div>

      {/* 画像管理モーダル */}
      {showImageManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">
                {t('budgetOptimizer.imageManager', currentLanguage, '画像管理')}
              </h3>
              <button
                onClick={() => setShowImageManager(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 一括ダウンロード */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => downloadMultipleImagesAsZip(optimizationImages, 'budget_optimization_images.zip')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  {t('budgetOptimizer.downloadAll', currentLanguage, '全画像をZIPでダウンロード')}
                </button>
              </div>

              {/* 画像リスト */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optimizationImages.map((image, index) => (
                  <div key={image.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {image.budgetNumber.toString().padStart(3, '0')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t('budgetOptimizer.budgetNumber', currentLanguage, '予算番号')}
                      </div>
                    </div>
                    
                    <div className="text-center mb-3">
                      <img
                        src={image.dataUrl}
                        alt={image.originalName}
                        className="w-full h-32 object-cover rounded-lg mx-auto"
                      />
                    </div>
                    
                    <div className="text-center mb-3">
                      <div className="text-xs text-gray-300 mb-1 truncate">
                        {image.originalName}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => downloadImage(image)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {t('budgetOptimizer.download', currentLanguage, 'ダウンロード')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
