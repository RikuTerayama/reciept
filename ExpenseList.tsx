'use client';

import React from 'react';
import { Trash2, Edit, CheckSquare, Square } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { ExpenseData } from '@/types';

export default function ExpenseList() {
  const { expenses, selectedExpenses, toggleExpenseSelection, deleteExpense } = useExpenseStore();

  if (expenses.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">経費リスト</h2>
        <p className="text-center text-gray-500 py-8">
          経費データがありません。画像をアップロードして経費を追加してください。
        </p>
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const selectedAmount = expenses
    .filter(expense => selectedExpenses.includes(expense.id))
    .reduce((sum, expense) => sum + expense.totalAmount, 0);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">経費リスト</h2>
        <div className="text-sm text-gray-600">
          <span className="mr-4">総額: ¥{totalAmount.toLocaleString()}</span>
          {selectedExpenses.length > 0 && (
            <span className="text-primary-600">
              選択済み: ¥{selectedAmount.toLocaleString()} ({selectedExpenses.length}件)
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                選択
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                日付
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                金額
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                税率
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                通貨
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                カテゴリ
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                部署
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                適格区分
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleExpenseSelection(expense.id)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {selectedExpenses.includes(expense.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {expense.date}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  ¥{expense.totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {expense.taxRate}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {expense.currency}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {expense.category}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {expense.department}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {expense.isQualified}
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        // 編集機能は後で実装
                        alert('編集機能は準備中です');
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('この経費を削除しますか？')) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
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

      {/* 経費詳細表示 */}
      {expenses.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-3">経費統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">総件数</p>
              <p className="font-medium">{expenses.length}件</p>
            </div>
            <div>
              <p className="text-gray-500">総金額</p>
              <p className="font-medium">¥{totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">平均金額</p>
              <p className="font-medium">¥{Math.round(totalAmount / expenses.length).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">選択済み</p>
              <p className="font-medium">{selectedExpenses.length}件</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 