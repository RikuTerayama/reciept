'use client';

import React, { useState, useEffect } from 'react';
import { ExpenseData, EXPENSE_CATEGORIES, QUALIFICATION_TYPES } from '@/types';
import { convertToJPY, convertFromJPY, fetchExchangeRates } from '@/lib/currency';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { useExchangeRates, convertCurrencyWithCache } from '@/lib/exchange-rate-cache';
import { useAuthStore } from '@/lib/auth-store';

interface ExpenseFormProps {
  initialData?: Partial<ExpenseData>;
  onSave: (data: ExpenseData) => void;
  onCancel?: () => void;
}

export default function ExpenseForm({ initialData, onSave, onCancel }: ExpenseFormProps) {
  const { user } = useAuthStore();
  const baseCurrency = user?.currency || 'JPY';
  
  const [formData, setFormData] = useState<ExpenseData>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    receiptDate: '',
    totalAmount: 0,
    category: '',
    description: '',
    taxRate: 10, // デフォルト税率を10%に設定
    participantFromClient: 0,
    participantFromCompany: 0,
    isQualified: 'Qualified invoice/receipt',
    currency: baseCurrency,
    originalAmount: 0,
    originalCurrency: baseCurrency,
    convertedAmount: 0,
    baseCurrency: baseCurrency,
    conversionRate: 1,
    conversionDate: new Date().toISOString(),
    createdAt: new Date(),
    rechargedToClient: 'N',
    gstVatApplicable: 'N',
    companyName: '-',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const currentLanguage = getCurrentLanguage();

  // 為替レート取得
  const { rates, isLoading: ratesLoading, isError: ratesError } = useExchangeRates(baseCurrency);

  // 通貨変更時の自動換算
  useEffect(() => {
    if (formData.currency !== baseCurrency && formData.totalAmount > 0 && rates) {
      handleCurrencyConversion();
    }
  }, [formData.currency, formData.totalAmount, rates, baseCurrency]);

  const handleCurrencyConversion = async () => {
    if (!rates || formData.currency === baseCurrency) return;

    setIsConverting(true);
    try {
      const conversion = convertCurrencyWithCache(
        formData.totalAmount,
        formData.currency,
        baseCurrency,
        rates.rates
      );

      setFormData(prev => ({
        ...prev,
        originalAmount: formData.totalAmount,
        originalCurrency: formData.currency,
        convertedAmount: conversion.convertedAmount,
        baseCurrency: conversion.baseCurrency,
        conversionRate: conversion.conversionRate,
        conversionDate: conversion.conversionDate
      }));
    } catch (error) {
      console.error('Currency conversion error:', error);
      setErrors(prev => ({ ...prev, currency: currentLanguage === 'en' ? 'Currency conversion failed' : '通貨換算に失敗しました' }));
    } finally {
      setIsConverting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 先頭0削除処理
    let processedValue = value;
    if (name === 'totalAmount' || name === 'taxRate' || name === 'participantFromClient' || name === 'participantFromCompany') {
      // 数値フィールドの場合、先頭0を削除
      if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
        processedValue = value.replace(/^0+/, '');
        if (processedValue === '') processedValue = '0';
      }
      // 数値として処理
      const numValue = parseFloat(processedValue) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.receiptDate) {
      newErrors.receiptDate = t('dataInput.validation.required', currentLanguage, '領収書日付を入力してください');
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = t('dataInput.validation.invalidAmount', currentLanguage, '有効な金額を入力してください');
    }

    if (!formData.category) {
      newErrors.category = t('dataInput.validation.required', currentLanguage, 'カテゴリを選択してください');
    }

    if (!formData.description) {
      newErrors.description = t('dataInput.validation.required', currentLanguage, '説明を入力してください');
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = t('dataInput.validation.invalidTaxRate', currentLanguage, '税率は0-100の範囲で入力してください');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // 通貨換算が完了していない場合は実行
      if (formData.currency !== baseCurrency && formData.convertedAmount === 0) {
        await handleCurrencyConversion();
      }

      const expenseData: ExpenseData = {
        ...formData,
        id: formData.id || Date.now().toString(),
        convertedAmount: formData.convertedAmount || formData.totalAmount,
        baseCurrency: baseCurrency
      };

      await onSave(expenseData);
    } catch (error: any) {
      console.error('Save error:', error);
      setErrors(prev => ({ ...prev, general: error.message || (currentLanguage === 'en' ? 'Save failed' : '保存に失敗しました') }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 領収書日付 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.receiptDate', currentLanguage, '領収書日付')} *
            </label>
            <input
              type="date"
              name="receiptDate"
              value={formData.receiptDate}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              required
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                errors.receiptDate ? 'border-red-500' : 'border-surface-600'
              }`}
            />
            {errors.receiptDate && <p className="text-red-400 text-sm mt-1">{errors.receiptDate}</p>}
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.amount', currentLanguage, '金額')} *
            </label>
            <div className="relative">
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                required
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.totalAmount ? 'border-red-500' : 'border-surface-600'
                }`}
                placeholder="0.00"
              />
              {isConverting && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {errors.totalAmount && <p className="text-red-400 text-sm mt-1">{errors.totalAmount}</p>}
          </div>

          {/* 通貨 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.currency', currentLanguage, '通貨')} *
            </label>
            <select
              name="currency"
              value={formData.currency}
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
            {errors.currency && <p className="text-red-400 text-sm mt-1">{errors.currency}</p>}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.category', currentLanguage, 'カテゴリ')} *
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
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.descriptionField', currentLanguage, '説明')} *
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
            placeholder={t('dataInput.descriptionPlaceholder', currentLanguage, '経費の詳細を入力')}
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 税率 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.taxRate', currentLanguage, '税率')} (%)
            </label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              min="0"
              max="100"
              step="0.1"
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                errors.taxRate ? 'border-red-500' : 'border-surface-600'
              }`}
              placeholder="10.0"
            />
            {errors.taxRate && <p className="text-red-400 text-sm mt-1">{errors.taxRate}</p>}
          </div>

          {/* クライアント参加人数 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.participantFromClient', currentLanguage, 'クライアント参加人数')}
            </label>
            <input
              type="number"
              name="participantFromClient"
              value={formData.participantFromClient}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              min="0"
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="0"
            />
          </div>

          {/* 会社参加人数 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.participantFromCompany', currentLanguage, '会社参加人数')}
            </label>
            <input
              type="number"
              name="participantFromCompany"
              value={formData.participantFromCompany}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              min="0"
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="0"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.companyName', currentLanguage, '会社名')}
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder={t('dataInput.companyNamePlaceholder', currentLanguage, '会社名を入力してください')}
          />
        </div>

        {/* 適格区分 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.isQualified', currentLanguage, '適格区分')}
          </label>
          <select
            name="isQualified"
            value={formData.isQualified}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            {QUALIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* 新しい項目 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recharged to client? */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('expenseForm.rechargedToClient', currentLanguage, 'クライアント請求有無')}
            </label>
            <select
              name="rechargedToClient"
              value={formData.rechargedToClient}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="N">N</option>
              <option value="Y">Y</option>
            </select>
          </div>

          {/* GST/VAT applicable */}
          <div>
            <label className="block text-sm font-medium mb-2 text-surface-300">
              {t('expenseForm.gstVatApplicable', currentLanguage, 'GST/VAT適用有無')}
            </label>
            <select
              name="gstVatApplicable"
              value={formData.gstVatApplicable}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="N">N</option>
              <option value="Y">Y</option>
            </select>
          </div>
        </div>

        {/* 通貨換算情報表示 */}
        {formData.currency !== baseCurrency && formData.convertedAmount > 0 && (
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400">
                {formData.originalAmount} {formData.originalCurrency} = {formData.convertedAmount} {formData.baseCurrency}
              </span>
                          <span className="text-blue-300">
              Rate: {formData.conversionRate}
            </span>
            </div>
          </div>
        )}

        {/* 為替レートエラー */}
        {ratesError && (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              {currentLanguage === 'en' ? 'Failed to fetch exchange rates. Using fixed rates.' : '為替レートの取得に失敗しました。固定レートを使用します。'}
            </p>
          </div>
        )}

        {/* 一般エラー */}
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex space-x-4 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium"
            >
              {t('dataInput.cancel', currentLanguage, 'キャンセル')}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || ratesLoading}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('dataInput.saving', currentLanguage, '保存中...') : t('dataInput.save', currentLanguage, '保存')}
          </button>
        </div>
      </form>
    </div>
  );
} 
