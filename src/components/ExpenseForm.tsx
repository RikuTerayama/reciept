'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData, EXPENSE_CATEGORIES, QUALIFICATION_TYPES } from '@/types';

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
    isQualified: 'Qualified invoice/receipt',
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
        {/* Excel出力の列順に合わせて項目を配置 */}
        
        {/* Receipt Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Receipt Date *
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

        {/* Total Amount (Inclusive GST/VAT) */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Total Amount (Inclusive GST/VAT) *
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
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-left ${
                errors.amount ? 'border-red-500' : 'border-surface-600'
              }`}
              placeholder="0"
            />
          </div>
          {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Category *
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
            <option value="">Select Category</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Description *
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
            placeholder="Enter expense details"
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Tax Rate (%) */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Tax Rate (%)
          </label>
          <div className="relative">
            <select
              name="taxRate"
              value={formData.taxRate}
              onChange={handleTaxRateChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-left"
            >
              <option value={0}>0%</option>
              <option value={10}>10%</option>
              <option value={8}>8%</option>
            </select>
          </div>
        </div>

        {/* # Participant from client */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            # Participant from client
          </label>
          <input
            type="text"
            name="participantFromClient"
            value={formData.participantFromClient}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter number of participants"
          />
        </div>

        {/* # Participant from company */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            # Participant from company
          </label>
          <input
            type="text"
            name="participantFromCompany"
            value={formData.participantFromCompany}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter number of participants"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency || 'JPY'}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            <option value="JPY">日本円（JPY）</option>
            <option value="USD">米ドル（USD）</option>
            <option value="EUR">ユーロ（EUR）</option>
            <option value="GBP">ポンド（GBP）</option>
            <option value="CNY">人民元（CNY）</option>
            <option value="KRW">韓国ウォン（KRW）</option>
            <option value="SGD">シンガポールドル（SGD）</option>
            <option value="AUD">豪ドル（AUD）</option>
            <option value="CAD">カナダドル（CAD）</option>
            <option value="CHF">スイスフラン（CHF）</option>
          </select>
        </div>

        {/* Tax Credit Q */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            Tax Credit Q
          </label>
          <select
            name="isQualified"
            value={formData.isQualified}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            {QUALIFICATION_TYPES.map((qualification) => (
              <option key={qualification} value={qualification}>
                {qualification}
              </option>
            ))}
          </select>
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
