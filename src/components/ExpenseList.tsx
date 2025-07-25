'use client';

import React from 'react';
import { Trash2, Edit, Download, Calendar, DollarSign, Tag, Building, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { exportExpensesToExcel, downloadSelectedReceiptImages } from '@/lib/excel';
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

  const handleDownloadSelectedImages = async () => {
    if (selectedExpenses.length === 0) {
      alert('ダウンロードする経費を選択してください。');
      return;
    }
    await downloadSelectedReceiptImages(expenses, selectedExpenses);
  };

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">経費データがありません</h3>
          <p className="text-gray-300">
            画像をアップロードして経費データを追加してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー（中央揃え） */}
      <div className="expense-list-header">
        <h1 className="expense-list-title">経費リスト</h1>
        <p className="expense-list-description">登録された経費データの一覧と管理</p>
      </div>

      {/* アクションバー（中央揃え） */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {expenses.length}件の経費データ
          </span>
          {selectedExpenses.length > 0 && (
            <span className="text-sm text-primary-400 font-medium">
              {selectedExpenses.length}件選択中
            </span>
          )}
        </div>
        {selectedExpenses.length > 0 && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportSelected}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>選択した経費をエクスポート</span>
            </button>
            <button
              onClick={handleDownloadSelectedImages}
              className="btn-secondary flex items-center space-x-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>画像一括ダウンロード</span>
            </button>
          </div>
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
                <th>説明</th>
                <th>クライアント側参加者</th>
                <th>会社側参加者</th>
                <th>税率</th>
                <th>適格区分</th>
                <th>レシート番号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{expense.date}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">
                        ¥{expense.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">{expense.currency}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{expense.category}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{expense.department}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.description || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.participantFromClient || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="max-w-xs">
                      <span className="text-sm text-gray-300">
                        {expense.participantFromCompany || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.taxRate}%
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{expense.isQualified}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="text-sm text-gray-600 font-mono">
                      {expense.receiptNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center space-x-2">
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
