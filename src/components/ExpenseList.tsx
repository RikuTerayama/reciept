'use client';

import React, { useState } from 'react';
import { useExpenseStore } from '@/lib/store';
import { Calendar, DollarSign, Tag, CheckCircle, Trash2, Edit, Download, FileText, X } from 'lucide-react';
import { exportExpensesToExcel } from '@/lib/excel';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';
import ExpenseForm from './ExpenseForm';

export default function ExpenseList() {
  const { expenses, deleteExpense, updateExpense } = useExpenseStore();
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const currentLanguage = getCurrentLanguage();

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirmDelete', currentLanguage))) {
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

  const handleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(exp => exp.id));
    }
  };

  const handleSelectExpense = (id: string) => {
    setSelectedExpenses(prev => 
      prev.includes(id) 
        ? prev.filter(expId => expId !== id)
        : [...prev, id]
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{t('expenseList.noExpenses', currentLanguage)}</h3>
        <p className="text-surface-400">{t('expenseList.addFirstExpense', currentLanguage)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('expenseList.title', currentLanguage)}</h3>
          <p className="text-sm text-surface-400">{t('expenseList.description', currentLanguage)}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedExpenses.length > 0 && (
            <>
              <button
                onClick={handleExportSelected}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{t('common.export', currentLanguage)}</span>
              </button>
              <button
                onClick={handleDownloadSelectedImages}
                className="px-3 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 text-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{t('common.download', currentLanguage)}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* リスト */}
      <div className="bg-surface-800 rounded-lg border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-900/50 border-b border-surface-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 bg-surface-700 border-surface-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">
                  {t('expenseList.date', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">
                  {t('expenseList.category', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-surface-300">
                  {t('expenseList.description', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-surface-300">
                  {t('expenseList.amount', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-surface-300">
                  {t('expenseList.taxRate', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-surface-300">
                  {t('expenseList.qualified', currentLanguage)}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-surface-300">
                  {t('common.actions', currentLanguage)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {expenses.map((expense) => (
                <tr 
                  key={expense.id} 
                  className="hover:bg-surface-700/50 transition-colors duration-200"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => handleSelectExpense(expense.id)}
                      className="w-4 h-4 text-primary-600 bg-surface-700 border-surface-600 rounded focus:ring-primary-500 focus:ring-2"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-surface-400" />
                      <span className="text-sm text-white">{expense.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-surface-400" />
                      <span className="text-sm text-white">{expense.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <span className="text-sm text-surface-300">
                        {expense.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium text-white">
                        {expense.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-700 text-surface-300">
                      {expense.taxRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className={`w-4 h-4 ${
                        expense.isQualified.includes('Qualified') 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`} />
                      <span className="text-sm text-surface-300">{expense.isQualified}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded-md transition-all duration-200 opacity-50 hover:opacity-100"
                        title={t('common.edit', currentLanguage)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 opacity-50 hover:opacity-100"
                        title={t('common.delete', currentLanguage)}
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
        <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              ¥{expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-surface-400">{t('stats.totalAmount', currentLanguage)}</div>
          </div>
        </div>
        <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              ¥{expenses
                .filter(exp => selectedExpenses.includes(exp.id))
                .reduce((sum, exp) => sum + exp.totalAmount, 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-surface-400">{t('stats.selectedAmount', currentLanguage)}</div>
          </div>
        </div>
        <div className="bg-surface-800 rounded-lg p-6 border border-surface-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {expenses.filter(exp => exp.isQualified.includes('Qualified')).length}
            </div>
            <div className="text-sm text-surface-400">{t('stats.qualifiedExpenses', currentLanguage)}</div>
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-surface-700 shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">{t('expenseList.editExpense', currentLanguage)}</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors duration-200"
              >
                <X className="w-5 h-5" />
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
