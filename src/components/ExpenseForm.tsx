'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Tag, FileText, Save, X } from 'lucide-react';
import { CURRENCIES, EXPENSE_CATEGORIES, TAX_RATES, QUALIFICATION_TYPES, ExpenseData } from '@/types';

interface ExpenseFormData {
  date: string;
  totalAmount: number;
  currency: string;
  category: string;
  description: string;
  participantFromClient: string;
  participantFromCompany: string;
  taxRate: number;
  isQualified: string;
}

interface ExpenseFormProps {
  expense?: ExpenseData;
  onSave: (expense: ExpenseData) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: '',
    totalAmount: 0,
    currency: 'JPY',
    category: '',
    description: '',
    participantFromClient: '',
    participantFromCompany: '',
    taxRate: 10,
    isQualified: 'Qualified invoice/receipt'
  });

  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({});

  useEffect(() => {
    if (expense) {
      const parsed = JSON.parse(JSON.stringify(expense));
      setFormData({
        date: parsed.date,
        totalAmount: parsed.totalAmount,
        currency: parsed.currency,
        category: parsed.category,
        description: parsed.description || '',
        participantFromClient: parsed.participantFromClient || '',
        participantFromCompany: parsed.participantFromCompany || '',
        taxRate: parsed.taxRate,
        isQualified: parsed.isQualified
      });
    }
  }, [expense]);

  const validateForm = () => {
    const newErrors: Partial<ExpenseFormData> = {};

    if (!formData.date) {
      newErrors.date = '日付は必須です';
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = '金額は0より大きい値を入力してください';
    }

    if (!formData.category) {
      newErrors.category = 'カテゴリは必須です';
    }

    if (!formData.currency) {
      newErrors.currency = '通貨は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const expenseData: ExpenseData = {
        id: expense?.id || Date.now().toString(),
        date: formData.date,
        totalAmount: formData.totalAmount,
        currency: formData.currency,
        category: formData.category,
        description: formData.description,
        participantFromClient: formData.participantFromClient,
        participantFromCompany: formData.participantFromCompany,
        taxRate: formData.taxRate,
        isQualified: formData.isQualified,
        createdAt: expense?.createdAt || new Date()
      };
      onSave(expenseData);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {expense ? '経費を編集' : '新しい経費を追加'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 日付 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                金額 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1000"
                min="0"
                step="1"
              />
              {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>}
            </div>

            {/* 通貨 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通貨 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.currency ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">カテゴリを選択</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* 税率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                税率 (%)
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TAX_RATES.map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
            </div>

            {/* 適格性 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                適格性
              </label>
              <select
                value={formData.isQualified}
                onChange={(e) => handleInputChange('isQualified', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {QUALIFICATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="経費の詳細説明を入力してください"
            />
          </div>

          {/* 参加者情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                クライアント側参加者
              </label>
              <input
                type="text"
                value={formData.participantFromClient}
                onChange={(e) => handleInputChange('participantFromClient', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="参加者名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会社側参加者
              </label>
              <input
                type="text"
                value={formData.participantFromCompany}
                onChange={(e) => handleInputChange('participantFromCompany', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="参加者名を入力"
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {expense ? '更新' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
