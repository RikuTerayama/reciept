'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { getExpenseData } from '@/lib/auth-service';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';
import { ChevronLeft, ChevronRight, Edit, Trash2, Download, Search } from 'lucide-react';

interface ExpenseListProps {
  onEdit?: (expense: ExpenseData) => void;
  onDelete?: (expenseId: string) => void;
}

const ITEMS_PER_PAGE = 20;

export default function ExpenseList({ onEdit, onDelete }: ExpenseListProps) {
  const { user } = useAuthStore();
  const { expenses, updateExpense, deleteExpense } = useExpenseStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [cloudExpenses, setCloudExpenses] = useState<ExpenseData[]>([]);
  const currentLanguage = getCurrentLanguage();

  // クラウドデータの取得
  useEffect(() => {
    if (!user?.uid) return;

    const loadCloudExpenses = async () => {
      setIsLoading(true);
      try {
        const cloudData = await getExpenseData(user.uid, 1000); // 最大1000件取得
        setCloudExpenses(cloudData);
      } catch (error) {
        console.error('Failed to load cloud expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCloudExpenses();
  }, [user?.uid]);

  // 全経費データ（ローカル + クラウド）
  const allExpenses = [...expenses, ...cloudExpenses];

  // 検索・フィルタリング
  const filteredExpenses = allExpenses.filter(expense => {
    const searchLower = searchTerm.toLowerCase();
    return (
      expense.description?.toLowerCase().includes(searchLower) ||
      expense.category?.toLowerCase().includes(searchLower) ||
      expense.receiptDate?.includes(searchTerm) ||
      expense.totalAmount?.toString().includes(searchTerm)
    );
  });

  // ソート
  const sortedExpenses = filteredExpenses.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.receiptDate || '');
        bValue = new Date(b.receiptDate || '');
        break;
      case 'amount':
        aValue = a.totalAmount || 0;
        bValue = b.totalAmount || 0;
        break;
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // ページネーション
  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = sortedExpenses.slice(startIndex, endIndex);

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // 検索処理
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 検索時は最初のページに戻る
  };

  // ソート処理
  const handleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 削除処理
  const handleDelete = async (expenseId: string) => {
    if (!confirm('この経費を削除しますか？')) return;

    try {
      // ローカルストアから削除
      deleteExpense(expenseId);
      
      // クラウドデータからも削除（実装予定）
      // await deleteExpenseData(user?.uid, expenseId);
      
      // ページネーション調整
      if (paginatedExpenses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('削除に失敗しました');
    }
  };

  // 統計情報
  const totalAmount = allExpenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
  const qualifiedCount = allExpenses.filter(exp => exp.isQualified?.includes('Qualified')).length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col space-y-4">
        {/* 統計情報 - スマホ時は中央揃え、PC時は従来通り */}
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-center">
          <div className="text-center">
            <div className="text-base md:text-lg font-semibold text-white">
              ¥{totalAmount.toLocaleString()}
            </div>
            <div className="text-surface-400">{t('stats.totalAmount')}</div>
          </div>
          <div className="text-center">
            <div className="text-base md:text-lg font-semibold text-white">
              {qualifiedCount}
            </div>
            <div className="text-surface-400">{t('stats.qualifiedExpenses')}</div>
          </div>
          <div className="text-center">
            <div className="text-base md:text-lg font-semibold text-white">
              {allExpenses.length}
            </div>
            <div className="text-surface-400">{t('common.items')}</div>
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t('expenseList.searchPlaceholder') || '経費を検索...'}
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
        
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-') as ['date' | 'amount' | 'category', 'asc' | 'desc'];
            setSortBy(field);
            setSortOrder(order);
          }}
          className="px-3 py-2 md:px-4 md:py-2 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        >
          <option value="date-desc">{t('expenseList.sort.dateDesc') || '日付（新しい順）'}</option>
          <option value="date-asc">{t('expenseList.sort.dateAsc') || '日付（古い順）'}</option>
          <option value="amount-desc">{t('expenseList.sort.amountDesc') || '金額（高い順）'}</option>
          <option value="amount-asc">{t('expenseList.sort.amountAsc') || '金額（低い順）'}</option>
          <option value="category-asc">{t('expenseList.sort.categoryAsc') || 'カテゴリ（A-Z）'}</option>
          <option value="category-desc">{t('expenseList.sort.categoryDesc') || 'カテゴリ（Z-A）'}</option>
        </select>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-surface-400 mt-2 text-sm md:text-base">{t('common.loading')}</p>
        </div>
      )}

      {/* 経費リスト */}
      {!isLoading && (
        <>
          {paginatedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-surface-400 mb-4 text-sm md:text-base">
                {searchTerm ? (t('expenseList.noSearchResults') || '検索条件に一致する経費が見つかりません') : (t('expenseList.noExpenses') || '経費データがありません')}
              </div>
              {!searchTerm && (
                <p className="text-xs md:text-sm text-surface-500">
                  {t('expenseList.addFirstExpense') || '画像アップロードまたは手動入力で経費を追加してください'}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-surface-800 rounded-lg border border-surface-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('expenseList.date')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('dataInput.descriptionField')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('dataInput.category')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('expenseList.amount')}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('dataInput.qualification')}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-surface-300 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700">
                    {paginatedExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-surface-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-white">
                          {expense.receiptDate ? new Date(expense.receiptDate).toLocaleDateString('ja-JP') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                          {expense.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-300">
                          {expense.category || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-white font-medium">
                              {expense.totalAmount?.toLocaleString() || '0'}
                            </span>
                            {expense.currency && expense.currency !== 'JPY' && (
                              <span className="text-xs text-surface-400">
                                ({expense.currency})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            expense.isQualified?.includes('Qualified')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {expense.isQualified || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(expense)}
                                className="p-1 text-surface-400 hover:text-blue-400 transition-colors"
                                title={t('common.edit')}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-1 text-surface-400 hover:text-red-400 transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-surface-400">
                {startIndex + 1}-{Math.min(endIndex, sortedExpenses.length)} / {sortedExpenses.length}件
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-surface-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-surface-400 hover:text-white hover:bg-surface-700'
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-surface-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
