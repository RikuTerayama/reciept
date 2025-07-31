'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';

interface ExpenseFormProps {
  onSave?: (expenseData: ExpenseData) => void;
  onCancel?: () => void;
  initialData?: Partial<ExpenseData>;
  hideTitle?: boolean;
}

export default function ExpenseForm({ onSave, onCancel, initialData, hideTitle }: ExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<ExpenseData>>({
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    currency: 'JPY',
    category: '',
    description: '',
    taxRate: 10,
    companyName: '',
    participantFromClient: 0,
    participantFromCompany: 0,
    isQualified: 'Not Qualified',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addExpense } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let processedValue = value;
    
    // 数値フィールドの先頭ゼロ削除
    if (type === 'number' && value) {
      processedValue = value.replace(/^0+/, '') || '0';
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = t('dataInput.validation.required', currentLanguage);
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = t('dataInput.validation.invalidAmount', currentLanguage);
    }

    if (!formData.category) {
      newErrors.category = t('dataInput.validation.required', currentLanguage);
    }

    if (formData.taxRate && (formData.taxRate < 0 || formData.taxRate > 100)) {
      newErrors.taxRate = t('dataInput.validation.invalidTaxRate', currentLanguage);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const expenseData: ExpenseData = {
      id: Date.now().toString(),
      date: formData.date!,
      totalAmount: formData.totalAmount!,
      currency: formData.currency!,
      category: formData.category!,
      description: formData.description || '',
      taxRate: formData.taxRate || 0,
      companyName: formData.companyName || '',
      participantFromClient: formData.participantFromClient || 0,
      participantFromCompany: formData.participantFromCompany || 0,
      isQualified: formData.isQualified!,
      createdAt: new Date()
    };

    addExpense(expenseData);
    
    if (onSave) {
      onSave(expenseData);
    }
  };

  const handleClear = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      currency: 'JPY',
      category: '',
      description: '',
      taxRate: 10,
      companyName: '',
      participantFromClient: 0,
      participantFromCompany: 0,
      isQualified: 'Not Qualified'
    });
    setErrors({});
  };

  return (
    <div className="space-y-6 text-center">
      {!hideTitle && (
        <h2 className="text-xl font-semibold mb-4">データ入力</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('dataInput.title', currentLanguage)}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.date', currentLanguage)} *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.date ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.amount', currentLanguage)} *</label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.totalAmount ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="1000"
            />
            {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.currency', currentLanguage)}</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="JPY">JPY</option>
              <option value="PHP">PHP</option>
              <option value="THB">THB</option>
              <option value="HKD">HKD</option>
              <option value="IDR">IDR</option>
              <option value="TRY">TRY</option>
              <option value="CNY">CNY</option>
              <option value="AUD">AUD</option>
              <option value="NOK">NOK</option>
              <option value="INR">INR</option>
              <option value="HUF">HUF</option>
              <option value="CHF">CHF</option>
              <option value="MXN">MXN</option>
              <option value="RUB">RUB</option>
              <option value="CAD">CAD</option>
              <option value="KRW">KRW</option>
              <option value="TWD">TWD</option>
              <option value="KWD">KWD</option>
              <option value="EUR">EUR</option>
              <option value="ZAR">ZAR</option>
              <option value="NZD">NZD</option>
              <option value="SAR">SAR</option>
              <option value="PLN">PLN</option>
              <option value="PGK">PGK</option>
              <option value="MYR">MYR</option>
              <option value="BHD">BHD</option>
              <option value="SGD">SGD</option>
              <option value="SEK">SEK</option>
              <option value="GBP">GBP</option>
              <option value="CZK">CZK</option>
              <option value="AED">AED</option>
              <option value="DKK">DKK</option>
              <option value="USD">USD</option>
              <option value="VND">VND</option>
              <option value="MMK">MMK</option>
              <option value="LBP">LBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.category', currentLanguage)} *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.category ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="">{t('common.select', currentLanguage)}</option>
              <option value="Salaries Expense - Temporary/Part-Time">Salaries Expense - Temporary/Part-Time</option>
              <option value="Interviewee Fee">Interviewee Fee</option>
              <option value="Telephone Allowance">Telephone Allowance</option>
              <option value="Staff Welfare Expenses">Staff Welfare Expenses</option>
              <option value="Staff Training">Staff Training</option>
              <option value="Recruitment Expenses">Recruitment Expenses</option>
              <option value="Employment Residency/Visa">Employment Residency/Visa</option>
              <option value="Travel & Expenses - Per Diem">Travel & Expenses - Per Diem</option>
              <option value="Travel & Expenses - Meal">Travel & Expenses - Meal</option>
              <option value="Travel & Expenses - Transportation">Travel & Expenses - Transportation</option>
              <option value="Travel & Expenses - Others">Travel & Expenses - Others</option>
              <option value="Travel & Expenses - Accommodation">Travel & Expenses - Accommodation</option>
              <option value="Entertainment & Gifts">Entertainment & Gifts</option>
              <option value="Meetings & Conferences">Meetings & Conferences</option>
              <option value="Marketing & Advertising">Marketing & Advertising</option>
              <option value="Market Research">Market Research</option>
              <option value="Rental - Others">Rental - Others</option>
              <option value="Office Cleaning">Office Cleaning</option>
              <option value="Repair & Maintenance">Repair & Maintenance</option>
              <option value="Insurance Expense - Corporate">Insurance Expense - Corporate</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Administrative Courier">Administrative Courier</option>
              <option value="Printing & Stationery">Printing & Stationery</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Sundry Administrative Expenses">Sundry Administrative Expenses</option>
              <option value="Business Registration & License Renewal">Business Registration & License Renewal</option>
              <option value="Fines & Penalties - Other">Fines & Penalties - Other</option>
              <option value="Bank Charges">Bank Charges</option>
              <option value="Others">Others</option>
              <option value="House Allowance">House Allowance</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.description', currentLanguage)}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder={t('dataInput.descriptionPlaceholder', currentLanguage)}
            />
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('dataInput.title', currentLanguage)}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.taxRate', currentLanguage)} (%)</label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleInputChange}
              min="0"
              max="100"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.taxRate ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.taxRate && <p className="text-red-500 text-sm mt-1">{errors.taxRate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">クライアント名</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder={t('dataInput.companyNamePlaceholder', currentLanguage)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">クライアント参加人数</label>
            <input
              type="number"
              name="participantFromClient"
              value={formData.participantFromClient}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">社内参加人数</label>
            <input
              type="number"
              name="participantFromCompany"
              value={formData.participantFromCompany}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.qualification', currentLanguage)}</label>
            <select
              name="isQualified"
              value={formData.isQualified}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="Qualified invoice/receipt">Qualified invoice/receipt</option>
              <option value="Qualified(by public transportation exception)">Qualified(by public transportation exception)</option>
              <option value="Qualified(by business trip/allowance exception)">Qualified(by business trip/allowance exception)</option>
              <option value="Not Qualified">Not Qualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t('dataInput.clear', currentLanguage)}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t('common.cancel', currentLanguage)}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('dataInput.save', currentLanguage)}
        </button>
      </div>
    </div>
  );
} 
