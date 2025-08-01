'use client';

import React, { useState } from 'react';
import { useExpenseStore } from '@/lib/store';
import { Calendar, DollarSign, Tag, CheckCircle, Trash2, Edit } from 'lucide-react';
import { exportExpensesToExcel } from '@/lib/excel';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';
import ExpenseForm from './ExpenseForm';

export default function ExpenseList() {
  const { expenses, selectedExpenses, toggleExpenseSelection, clearSelection, selectAllExpenses, deleteExpense, updateExpense } = useExpenseStore();
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm', currentLanguage))) {
      deleteExpense(id);
    }
  };

  const handleEdit = (expense: ExpenseData) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedExpense: ExpenseData) => {
    updateExpense(updatedExpense);
    setShowEditModal(false);
    setEditingExpense(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingExpense(null);
  };

  const handleExportSelected = () => {
    const selectedExpensesData = expenses.filter(exp => selectedExpenses.includes(exp.id));
    exportExpensesToExcel(selectedExpensesData, 'selected_expenses.xlsx');
  };

  const handleDownloadSelectedImages = async () => {
    // 画像ダウンロード機能は後で実装
    console.log('Download selected images');
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Tag className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('expenseList.noData', currentLanguage)}</h3>
        <p className="text-sm text-gray-500">{t('expenseList.noDataDescription', currentLanguage)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {expenses.length} {t('expenseList.expenseCount', currentLanguage)}
          </span>
          {selectedExpenses.length > 0 && (
            <span className="text-sm text-blue-400">
              {selectedExpenses.length} {t('expenseList.selectedCount', currentLanguage)}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedExpenses.length > 0 && (
            <>
              <button
                onClick={handleExportSelected}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {t('expenseList.exportSelected', currentLanguage)}
              </button>
              <button
                onClick={handleDownloadSelectedImages}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                {t('expenseList.downloadSelectedImages', currentLanguage)}
              </button>
            </>
          )}
          <button
            onClick={selectAllExpenses}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            {t('common.select', currentLanguage)} {t('common.items', currentLanguage)}
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel', currentLanguage)}
          </button>
        </div>
      </div>

      {/* 経費テーブル */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={() => selectedExpenses.length === expenses.length ? clearSelection() : selectAllExpenses()}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.date', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.amount', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.category', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('dataInput.description', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('dataInput.participantFromClient', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('dataInput.participantFromCompany', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.taxRate', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.qualification', currentLanguage)}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {t('expenseList.actions', currentLanguage)}
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-800">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{expense.date}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-semibold">
                        ¥{expense.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400">{expense.currency}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{expense.category}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.description || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.participantFromClient || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.participantFromCompany || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.taxRate}%
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{expense.isQualified}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="stat-number">
            ¥{expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toLocaleString()}
          </div>
          <div className="stat-label">総金額</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-number">
            ¥{expenses
              .filter(exp => selectedExpenses.includes(exp.id))
              .reduce((sum, exp) => sum + exp.totalAmount, 0)
              .toLocaleString()}
          </div>
          <div className="stat-label">選択金額</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-number">
            {expenses.filter(exp => exp.isQualified.includes('Qualified')).length}
          </div>
          <div className="stat-label">適格経費</div>
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">経費編集</h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>
            <ExpenseForm 
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              initialData={editingExpense}
              hideTitle={true}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
