'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { ExpenseData, CURRENCIES, EXPENSE_CATEGORIES, TAX_RATES, DEPARTMENTS, QUALIFICATION_TYPES } from '@/types';

export default function ExpenseForm() {
  const { ocrResult, addExpense, expenses } = useExpenseStore();
  const [formData, setFormData] = useState<Partial<ExpenseData>>({
    date: '',
    totalAmount: 0,
    taxRate: 10,
    currency: 'JPY',
    category: '',
    department: '',
    isQualified: 'Qualified invoice/receipt',
  });

  // OCR結果が更新されたらフォームに反映
  useEffect(() => {
    if (ocrResult) {
      setFormData(prev => ({
        ...prev,
        date: ocrResult.date || '',
        totalAmount: ocrResult.totalAmount || 0,
        taxRate: ocrResult.taxRate || 10,
        isQualified: ocrResult.isQualified 
          ? 'Qualified invoice/receipt' 
          : 'Not Qualified',
      }));
    }
  }, [ocrResult]);

  const handleInputChange = (field: keyof ExpenseData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.totalAmount || !formData.category || !formData.department) {
      alert('必須項目を入力してください');
      return;
    }

    const newExpense: ExpenseData = {
      id: Date.now().toString(),
      date: formData.date!,
      totalAmount: formData.totalAmount!,
      taxRate: formData.taxRate!,
      currency: formData.currency!,
      category: formData.category!,
      department: formData.department!,
      isQualified: formData.isQualified!,
      ocrText: ocrResult?.text,
      createdAt: new Date(),
    };

    addExpense(newExpense);
    
    // フォームをリセット
    setFormData({
      date: '',
      totalAmount: 0,
      taxRate: 10,
      currency: 'JPY',
      category: '',
      department: '',
      isQualified: 'Qualified invoice/receipt',
    });
  };

  if (!ocrResult) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg">
        <p className="text-center text-gray-500">
          画像をアップロードしてOCR処理を実行してください
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">経費データ入力</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付 *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* 合計金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              合計金額 *
            </label>
            <input
              type="number"
              value={formData.totalAmount}
              onChange={(e) => handleInputChange('totalAmount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* 税率 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              税率
            </label>
            <select
              value={formData.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TAX_RATES.map(rate => (
                <option key={rate} value={rate}>{rate}%</option>
              ))}
            </select>
          </div>

          {/* 通貨 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              通貨
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CURRENCIES.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              経費カテゴリ *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">選択してください</option>
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* 部署 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属部署 *
            </label>
            <select
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">選択してください</option>
              {DEPARTMENTS.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          {/* 適格区分 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              適格/非適格の区分
            </label>
            <select
              value={formData.isQualified}
              onChange={(e) => handleInputChange('isQualified', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {QUALIFICATION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => setFormData({
              date: '',
              totalAmount: 0,
              taxRate: 10,
              currency: 'JPY',
              category: '',
              department: '',
              isQualified: 'Qualified invoice/receipt',
            })}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            リセット
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            追加
          </button>
        </div>
      </form>

      {/* OCR結果の表示 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">OCR抽出結果</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>抽出テキスト:</strong></p>
          <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border">
            {ocrResult.text}
          </pre>
        </div>
      </div>
    </div>
  );
}
