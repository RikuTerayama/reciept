'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';

interface ExpenseFormProps {
  onSave: (data: ExpenseData) => void;
  onCancel?: () => void;
  initialData?: ExpenseData;
  hideTitle?: boolean;
}

export default function ExpenseForm({ onSave, onCancel, initialData, hideTitle }: ExpenseFormProps) {
  const currentLanguage = getCurrentLanguage();
  const [formData, setFormData] = useState<ExpenseData>({
    id: '',
    date: '',
    category: '',
    description: '',
    amount: 0,
    taxRate: 10,
    isQualified: 'Qualified',
    participantFromClient: '',
    participantFromCompany: '',
    totalAmount: 0,
    receiptImage: null,
    ...initialData
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = Number(e.target.value) || 0;
    const taxRate = formData.taxRate;
    const totalAmount = amount * (1 + taxRate / 100);
    
    setFormData(prev => ({
      ...prev,
      amount,
      totalAmount
    }));
  };

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taxRate = Number(e.target.value);
    const amount = formData.amount;
    const totalAmount = amount * (1 + taxRate / 100);
    
    setFormData(prev => ({
      ...prev,
      taxRate,
      totalAmount
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.date) {
      newErrors.date = t('dataInput.validation.required', currentLanguage);
    }
    if (!formData.category) {
      newErrors.category = t('dataInput.validation.required', currentLanguage);
    }
    if (!formData.description) {
      newErrors.description = t('dataInput.validation.required', currentLanguage);
    }
    if (formData.amount <= 0) {
      newErrors.amount = t('dataInput.validation.amount', currentLanguage);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const expenseData: ExpenseData = {
      ...formData,
      id: formData.id || `expense_${Date.now()}`,
      totalAmount: formData.amount * (1 + formData.taxRate / 100)
    };

    onSave(expenseData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        const inputs = Array.from(form.elements) as HTMLInputElement[];
        const currentIndex = inputs.findIndex(input => input === e.currentTarget);
        const nextInput = inputs[currentIndex + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white">{t('dataInput.title', currentLanguage)}</h3>
          <p className="text-sm text-surface-400 mt-1">{t('dataInput.description', currentLanguage)}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.date', currentLanguage)} *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              required
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                errors.date ? 'border-red-500' : 'border-surface-600'
              }`}
            />
            {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.category', currentLanguage)} *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              required
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                errors.category ? 'border-red-500' : 'border-surface-600'
              }`}
            >
              <option value="">{t('dataInput.selectCategory', currentLanguage)}</option>
              <option value="交通費">{t('dataInput.categories.transport', currentLanguage)}</option>
              <option value="食費">{t('dataInput.categories.food', currentLanguage)}</option>
              <option value="宿泊費">{t('dataInput.categories.accommodation', currentLanguage)}</option>
              <option value="会議費">{t('dataInput.categories.meeting', currentLanguage)}</option>
              <option value="通信費">{t('dataInput.categories.communication', currentLanguage)}</option>
              <option value="その他">{t('dataInput.categories.other', currentLanguage)}</option>
            </select>
            {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.description', currentLanguage)} *
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            required
            className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
              errors.description ? 'border-red-500' : 'border-surface-600'
            }`}
            placeholder={t('dataInput.descriptionPlaceholder', currentLanguage)}
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.amount', currentLanguage)} *
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount || ''}
                onChange={handleAmountChange}
                onKeyPress={handleKeyPress}
                required
                min="0"
                step="1"
                className={`w-full px-4 py-3 pr-12 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-right ${
                  errors.amount ? 'border-red-500' : 'border-surface-600'
                }`}
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-surface-400 text-sm">¥</span>
              </div>
            </div>
            {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* 税率 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.taxRate', currentLanguage)}
            </label>
            <div className="relative">
              <select
                name="taxRate"
                value={formData.taxRate}
                onChange={handleTaxRateChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-right"
              >
                <option value={0}>0%</option>
                <option value={10}>10%</option>
                <option value={8}>8%</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-surface-400 text-sm">%</span>
              </div>
            </div>
          </div>

          {/* 合計金額 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.totalAmount', currentLanguage)}
            </label>
            <div className="relative">
              <input
                type="text"
                value={`¥${formData.totalAmount.toLocaleString()}`}
                readOnly
                className="w-full px-4 py-3 pr-12 bg-surface-800 border border-surface-600 rounded-lg text-white text-right cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-surface-400 text-sm">合計</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 適格区分 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.isQualified', currentLanguage)}
            </label>
            <select
              name="isQualified"
              value={formData.isQualified}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="Qualified">{t('dataInput.qualified', currentLanguage)}</option>
              <option value="Non-Qualified">{t('dataInput.nonQualified', currentLanguage)}</option>
            </select>
          </div>

          {/* 参加人数（クライアント） */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.participantFromClient', currentLanguage)}
            </label>
            <input
              type="text"
              name="participantFromClient"
              value={formData.participantFromClient}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder={t('dataInput.participantPlaceholder', currentLanguage)}
            />
          </div>
        </div>

        {/* 参加人数（会社） */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.participantFromCompany', currentLanguage)}
          </label>
          <input
            type="text"
            name="participantFromCompany"
            value={formData.participantFromCompany}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder={t('dataInput.participantPlaceholder', currentLanguage)}
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium"
            >
              {t('common.cancel', currentLanguage)}
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
          >
            {t('common.save', currentLanguage)}
          </button>
        </div>
      </form>
    </div>
  );
} 
