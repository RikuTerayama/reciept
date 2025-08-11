'use client';

import React, { useState, useEffect } from 'react';
import { ExpenseData, EXPENSE_CATEGORIES, QUALIFICATION_TYPES } from '@/types';
import { convertToJPY, convertFromJPY, fetchExchangeRates } from '@/lib/currency';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { useExchangeRates, convertCurrencyWithCache } from '@/lib/exchange-rate-cache';
import { useAuthStore } from '@/lib/auth-store';
import { useExpenseStore } from '@/lib/store';
import { createSpeechRecognizer } from '@/lib/voice';
import { parseJaSpeechToDateAmount } from '@/lib/voiceParse';
import { Mic, MicOff, X } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Partial<ExpenseData>;
  onSave: (data: ExpenseData) => void;
  onCancel?: () => void;
}

export default function ExpenseForm({ initialData, onSave, onCancel }: ExpenseFormProps) {
  const { user } = useAuthStore();
  const { ocrResult } = useExpenseStore();
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

  // 数値フィールドの表示値を管理する状態
  const [displayValues, setDisplayValues] = useState({
    totalAmount: initialData?.totalAmount?.toString() || '',
    taxRate: initialData?.taxRate?.toString() || '10',
    participantFromClient: initialData?.participantFromClient?.toString() || '',
    participantFromCompany: initialData?.participantFromCompany?.toString() || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<ReturnType<typeof createSpeechRecognizer> | null>(null);
  const currentLanguage = getCurrentLanguage();

  // 為替レート取得
  const { rates, isLoading: ratesLoading, isError: ratesError } = useExchangeRates(baseCurrency);

  // 音声認識の初期化
  useEffect(() => {
    const recognizer = createSpeechRecognizer();
    setSpeechRecognizer(recognizer);
  }, []);

  // 音声入力処理
  const handleVoiceInput = async () => {
    if (!speechRecognizer?.supported) {
      alert(t('errors.speechUnsupported', currentLanguage, 'このブラウザは音声入力に対応していません'));
      return;
    }

    setIsListening(true);
    try {
      const speechText = await speechRecognizer.start();
      const result = parseJaSpeechToDateAmount(speechText);
      
      if (result.date || result.amount) {
        const updates: Partial<ExpenseData> = {};
        if (result.date) updates.date = result.date;
        if (result.amount) {
          updates.totalAmount = result.amount;
          setDisplayValues(prev => ({ ...prev, totalAmount: result.amount.toString() }));
        }
        
        setFormData(prev => ({ ...prev, ...updates }));
        
        // 結果をトースト表示
        const summary = [];
        if (result.date) summary.push(`日付: ${result.date}`);
        if (result.amount) summary.push(`金額: ¥${result.amount.toLocaleString('ja-JP')}`);
        
        alert(`${t('voice.result', currentLanguage, '抽出結果')}: ${summary.join(' / ')}`);
      } else {
        alert('音声から日付・金額を抽出できませんでした。もう一度お試しください。');
      }
    } catch (error) {
      console.error('Voice input error:', error);
      alert(t('errors.speechError', currentLanguage, '音声認識でエラーが発生しました'));
    } finally {
      setIsListening(false);
    }
  };

  // 音声入力を停止
  const stopVoiceInput = () => {
    if (speechRecognizer?.supported) {
      speechRecognizer.stop();
    }
    setIsListening(false);
  };

  // OCR結果がある場合、フォームに設定
  useEffect(() => {
    if (ocrResult && !initialData) {
      const ocrData: Partial<ExpenseData> = {
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        receiptDate: ocrResult.date || new Date().toISOString().split('T')[0],
        totalAmount: ocrResult.totalAmount || 0,
        category: ocrResult.category || '',
        description: ocrResult.description || '',
        taxRate: ocrResult.taxRate || 10,
        isQualified: ocrResult.isQualified ? 'Qualified invoice/receipt' : 'Not Qualified',
        currency: baseCurrency,
        originalAmount: ocrResult.totalAmount || 0,
        originalCurrency: baseCurrency,
        convertedAmount: ocrResult.totalAmount || 0,
        baseCurrency: baseCurrency,
        conversionRate: 1,
        companyName: ocrResult.companyName || '-',
        imageData: ocrResult.imageData || null,
        ocrText: ocrResult.text || '',
        receiptNumber: ocrResult.receiptNumber || '',
      };
      
      setFormData(prev => ({ ...prev, ...ocrData }));
      
      // 表示値も更新
      setDisplayValues(prev => ({
        ...prev,
        totalAmount: (ocrResult.totalAmount || 0).toString(),
        taxRate: (ocrResult.taxRate || 10).toString(),
      }));
    }
  }, [ocrResult, initialData, baseCurrency]);

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
    
    // 数値フィールドの先頭0削除処理
    if (name === 'totalAmount' || name === 'taxRate' || name === 'participantFromClient' || name === 'participantFromCompany') {
      let processedValue = value;
      
      // 先頭の0を削除（ただし、0単体や小数点の前の0は保持）
      if (value.startsWith('0') && value.length > 1) {
        // 小数点が含まれている場合は、小数点の前の0のみを削除
        if (value.includes('.')) {
          const parts = value.split('.');
          const integerPart = parts[0].replace(/^0+/, '') || '0';
          processedValue = integerPart + '.' + parts[1];
        } else {
          // 小数点が含まれていない場合は、先頭の0を削除
          processedValue = value.replace(/^0+/, '') || '0';
        }
      }
      
      // 表示値を更新
      setDisplayValues(prev => ({ ...prev, [name]: processedValue }));
      
      // 数値として処理
      const numValue = parseFloat(processedValue) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = t('form.dateRequired', currentLanguage, '日付は必須です');
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = t('form.amountRequired', currentLanguage, '金額は必須です');
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

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (name === 'totalAmount' || name === 'taxRate' || name === 'participantFromClient' || name === 'participantFromCompany') {
      // フォーカス時に0の場合は空にする
      if (displayValues[name as keyof typeof displayValues] === '0') {
        setDisplayValues(prev => ({ ...prev, [name]: '' }));
      }
      
      // 金額フィールドの場合は千位区切りを除去して数値のみ表示
      if (name === 'totalAmount') {
        setDisplayValues(prev => ({ 
          ...prev, 
          totalAmount: formData.totalAmount.toString() 
        }));
      }
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (name === 'totalAmount' || name === 'taxRate' || name === 'participantFromClient' || name === 'participantFromCompany') {
      // フォーカスが外れた時に空の場合は0にする
      if (displayValues[name as keyof typeof displayValues] === '') {
        setDisplayValues(prev => ({ ...prev, [name]: '0' }));
        setFormData(prev => ({ ...prev, [name]: 0 }));
      }
      
      // 金額フィールドの場合は千位区切りを表示
      if (name === 'totalAmount' && formData.totalAmount > 0) {
        setDisplayValues(prev => ({ 
          ...prev, 
          totalAmount: formData.totalAmount.toLocaleString('ja-JP') 
        }));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* OCR結果通知 */}
      {ocrResult && !initialData && (
        <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-blue-300 text-lg">📷</div>
            <div className="flex-1">
              <p className="text-blue-300 font-medium">OCR処理が完了しました</p>
              <p className="text-blue-200 text-sm mt-1">
                以下の情報を確認・編集してから保存してください。
              </p>
              {/* 不足情報の案内 */}
              {(!ocrResult.date || !ocrResult.totalAmount) && (
                <div className="mt-2 p-2 bg-blue-500/20 rounded border border-blue-400/30">
                  <p className="text-blue-200 text-xs">
                    💡 足りない情報は音声で入力できます
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 音声入力ボタン */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-surface-400">
          {t('form.requiredNotice', currentLanguage, '日付と金額は必須です')}
        </div>
        <div className="flex gap-2">
          {isListening ? (
            <button
              type="button"
              onClick={stopVoiceInput}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors animate-pulse"
              aria-label="音声入力を停止"
              aria-pressed="true"
              aria-busy="true"
            >
              <MicOff className="w-4 h-4" />
              <span className="hidden sm:inline">{t('voice.stop', currentLanguage, '停止')}</span>
              <span className="text-xs">聴き取り中...</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={!speechRecognizer?.supported}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                speechRecognizer?.supported
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-surface-600 text-surface-400 cursor-not-allowed'
              }`}
              aria-label="音声で入力"
              aria-pressed="false"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">{t('voice.start', currentLanguage, '音声で入力')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 音声入力中の表示 */}
      {isListening && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-300">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm font-medium">{t('voice.listening', currentLanguage, '聴き取り中...')}</span>
            <span className="text-xs">話しかけてください</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 日付（必須） */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.date', currentLanguage, '日付')} *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              required
              className={`w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm ${
                errors.date ? 'border-red-500' : 'border-surface-600'
              }`}
            />
            {errors.date && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.date}</p>}
          </div>

          {/* 金額（必須） */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.amount', currentLanguage, '金額')} *
            </label>
            <div className="relative">
              <input
                type="number"
                name="totalAmount"
                value={displayValues.totalAmount}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleNumberFocus}
                onBlur={handleNumberBlur}
                required
                step="0.01"
                min="0"
                className={`w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm ${
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
            {errors.totalAmount && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.totalAmount}</p>}
          </div>

          {/* 通貨 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.currency', currentLanguage, '通貨')}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
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
            {errors.currency && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.currency}</p>}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.category', currentLanguage, 'カテゴリ')}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm ${
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
            {errors.category && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.category}</p>}
          </div>
        </div>

                  {/* 説明 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.descriptionField', currentLanguage, '説明')}
            </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm ${
              errors.description ? 'border-red-500' : 'border-surface-600'
            }`}
            placeholder={t('dataInput.descriptionPlaceholder', currentLanguage, '経費の詳細を入力')}
          />
          {errors.description && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 税率 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.taxRate', currentLanguage, '税率')} (%)
            </label>
            <input
              type="number"
              name="taxRate"
              value={displayValues.taxRate}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleNumberFocus}
              onBlur={handleNumberBlur}
              min="0"
              max="100"
              step="0.1"
              className={`w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm ${
                errors.taxRate ? 'border-red-500' : 'border-surface-600'
              }`}
              placeholder="10.0"
            />
            {errors.taxRate && <p className="text-red-400 text-xs md:text-sm mt-1">{errors.taxRate}</p>}
          </div>

          {/* クライアント参加人数 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.participantFromClient', currentLanguage, 'クライアント参加人数')}
            </label>
            <input
              type="number"
              name="participantFromClient"
              value={displayValues.participantFromClient}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleNumberFocus}
              onBlur={handleNumberBlur}
              min="0"
              className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
              placeholder="0"
            />
          </div>

          {/* 会社参加人数 */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('dataInput.participantFromCompany', currentLanguage, '会社参加人数')}
            </label>
            <input
              type="number"
              name="participantFromCompany"
              value={displayValues.participantFromCompany}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleNumberFocus}
              onBlur={handleNumberBlur}
              min="0"
              className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.companyName', currentLanguage, '会社名')}
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
            placeholder={t('dataInput.companyNamePlaceholder', currentLanguage, '会社名を入力してください')}
          />
        </div>

        {/* 適格区分 */}
        <div>
          <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
            {t('dataInput.isQualified', currentLanguage, '適格区分')}
          </label>
          <select
            name="isQualified"
            value={formData.isQualified}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            {QUALIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* 新しい項目 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Recharged to client? */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('expenseForm.rechargedToClient', currentLanguage, 'クライアント請求有無')}
            </label>
            <select
              name="rechargedToClient"
              value={formData.rechargedToClient}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
            >
              <option value="N">N</option>
              <option value="Y">Y</option>
            </select>
          </div>

          {/* GST/VAT applicable */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-surface-300">
              {t('expenseForm.gstVatApplicable', currentLanguage, 'GST/VAT適用有無')}
            </label>
            <select
              name="gstVatApplicable"
              value={formData.gstVatApplicable}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full sm:w-auto px-3 py-2 md:px-4 md:py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
            >
              <option value="N">N</option>
              <option value="Y">Y</option>
            </select>
          </div>
        </div>

                {/* 通貨換算情報表示 */}
        {formData.currency !== baseCurrency && formData.convertedAmount > 0 && (
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs md:text-sm">
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
            <p className="text-yellow-400 text-xs md:text-sm">
              {currentLanguage === 'en' ? 'Failed to fetch exchange rates. Using fixed rates.' : '為替レートの取得に失敗しました。固定レートを使用します。'}
            </p>
          </div>
        )}

        {/* 一般エラー */}
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-xs md:text-sm">{errors.general}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex space-x-4 pt-4 md:pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium text-sm md:text-base"
            >
              {t('dataInput.cancel', currentLanguage, 'キャンセル')}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || ratesLoading}
            className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {isLoading ? t('dataInput.saving', currentLanguage, '保存中...') : t('dataInput.save', currentLanguage, '保存')}
          </button>
        </div>
      </form>

      {/* モバイル用フローティングマイクボタン */}
      {speechRecognizer?.supported && (
        <div className="fixed bottom-6 right-6 md:hidden">
          {isListening ? (
            <button
              onClick={stopVoiceInput}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 animate-pulse"
              aria-label="音声入力を停止"
              aria-pressed="true"
              aria-busy="true"
            >
              <MicOff className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleVoiceInput}
              className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="音声で入力"
              aria-pressed="false"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
} 
