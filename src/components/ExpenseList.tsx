'use client';

import React from 'react';
import { Trash2, Edit, Download, Calendar, DollarSign, Tag, Building, CheckCircle } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel } from '@/lib/excel';
import { ExpenseData } from '@/types';

export default function ExpenseList() {
  const { expenses, selectedExpenses, toggleExpenseSelection, deleteExpense } = useExpenseStore();

  const handleDelete = (id: string) => {
    if (confirm('この経費を削除しますか？')) {
      deleteExpense(id);
    }
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

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">経費データがありません</h3>
          <p className="text-gray-500">
            画像をアップロードして経費データを追加してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* アクションバー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {expenses.length}件の経費データ
          </span>
          {selectedExpenses.length > 0 && (
            <span className="text-sm text-primary-600 font-medium">
              {selectedExpenses.length}件選択中
            </span>
          )}
        </div>
        {selectedExpenses.length > 0 && (
          <button
            onClick={handleExportSelected}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>選択した経費をエクスポート</span>
          </button>
        )}
      </div>

      {/* 経費リスト */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        expenses.forEach(expense => {
                          if (!selectedExpenses.includes(expense.id)) {
                            toggleExpenseSelection(expense.id);
                          }
                        });
                      } else {
                        selectedExpenses.forEach(id => toggleExpenseSelection(id));
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>日付</th>
                <th>金額</th>
                <th>カテゴリ</th>
                <th>部署</th>
                <th>税率</th>
                <th>適格区分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{expense.date}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">
                        ¥{expense.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">{expense.currency}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{expense.category}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{expense.department}</span>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.taxRate}%
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{expense.isQualified}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
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
        <div className="stat-card">
          <div className="stat-number">
            ¥{expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toLocaleString()}
          </div>
          <div className="stat-label">総金額</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            ¥{expenses
              .filter(exp => selectedExpenses.includes(exp.id))
              .reduce((sum, exp) => sum + exp.totalAmount, 0)
              .toLocaleString()}
          </div>
          <div className="stat-label">選択金額</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {expenses.filter(exp => exp.isQualified.includes('Qualified')).length}
          </div>
          <div className="stat-label">適格経費</div>
        </div>
      </div>
    </div>
  );
} 
