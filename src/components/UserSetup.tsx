'use client';

import React, { useState } from 'react';
import { getCurrentLanguage, t, Language } from '@/lib/i18n';
import { getBaseCurrencyForOffice, OFFICE_BASE_CURRENCIES } from '@/lib/currencyConverter';

interface UserInfo {
  email: string;
  office: string;
  targetMonth: string;
  budget: number;
  currency: string;
}

interface UserSetupProps {
  onSave: (userInfo: UserInfo) => void;
  hideWelcomeTitle?: boolean;
}

export default function UserSetup({ onSave, hideWelcomeTitle = false }: UserSetupProps) {
  const [formData, setFormData] = useState<UserInfo>({
    email: '',
    office: 'japan',
    targetMonth: '',
    budget: 0,
    currency: 'JPY'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentLanguage = getCurrentLanguage();

  // デバッグログを追加
  console.log('[UserSetup] typeof t =', typeof t, 'value:', t);
  console.log('[UserSetup] currentLanguage =', currentLanguage);

  // 安全なt関数のラッパー
  const safeT = (key: string, lang: Language = currentLanguage, defaultValue?: string): string => {
    try {
      console.log('[UserSetup] safeT called with key:', key, 'lang:', lang);
      console.log('[UserSetup] typeof t in safeT =', typeof t);
      
      if (typeof t !== 'function') {
        console.error('[UserSetup] t is not a function!');
        return defaultValue || key;
      }
      
      return t(key, lang, defaultValue);
    } catch (error) {
      console.error('[UserSetup] Translation error:', error);
      return defaultValue || key;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'office') {
      // オフィス選択時に基軸通貨を自動設定
      const baseCurrency = getBaseCurrencyForOffice(value);
      setFormData(prev => ({
        ...prev,
        office: value,
        currency: baseCurrency
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'budget' ? Number(value) || 0 : value
      }));
    }

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = safeT('dataInput.validation.required', currentLanguage, 'この項目は必須です');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = safeT('dataInput.validation.invalidEmail', currentLanguage, '有効なメールアドレスを入力してください');
    }

    if (!formData.targetMonth) {
      newErrors.targetMonth = safeT('dataInput.validation.required', currentLanguage, 'この項目は必須です');
    }

    if (!formData.budget || formData.budget <= 0) {
      newErrors.budget = safeT('dataInput.validation.invalidAmount', currentLanguage, '有効な金額を入力してください');
    }

    if (!formData.currency) {
      newErrors.currency = safeT('dataInput.validation.required', currentLanguage, 'この項目は必須です');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      // サイレント保存 - ポップアップを表示しない
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {!hideWelcomeTitle && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{safeT('welcome.title', currentLanguage, 'Welcome')}</h2>
          <p className="text-xl text-gray-400">{safeT('welcome.description', currentLanguage, 'OCR技術による自動抽出・管理')}</p>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-6 text-center">{safeT('common.settings', currentLanguage, '設定')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full flex flex-col items-center">
          <div className="w-full max-w-full flex flex-col items-center">
            <label className="block text-sm font-medium mb-2 text-center">{safeT('common.email', currentLanguage, 'メールアドレス')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full max-w-xs sm:max-w-sm px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="example@company.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1 text-center">{errors.email}</p>}
          </div>

          <div className="w-full max-w-full flex flex-col items-center">
            <label className="block text-sm font-medium mb-2 text-center">{safeT('common.office', currentLanguage, 'オフィス')} *</label>
            <select
              name="office"
              value={formData.office}
              onChange={handleInputChange}
              required
              className={`w-full max-w-xs sm:max-w-sm px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.office ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="japan">日本 (JPY)</option>
              <option value="singapore">シンガポール (SGD)</option>
              <option value="australia">オーストラリア (AUD)</option>
              <option value="hongkong">香港 (HKD)</option>
              <option value="thailand">タイ (THB)</option>
              <option value="philippines">フィリピン (PHP)</option>
              <option value="indonesia">インドネシア (IDR)</option>
              <option value="malaysia">マレーシア (MYR)</option>
              <option value="vietnam">ベトナム (VND)</option>
              <option value="myanmar">ミャンマー (MMK)</option>
            </select>
            {errors.office && <p className="text-red-500 text-sm mt-1 text-center">{errors.office}</p>}
          </div>

          <div className="w-full max-w-full flex flex-col items-center">
            <label className="block text-sm font-medium mb-2 text-center">{safeT('common.targetMonth', currentLanguage, '対象月')} *</label>
            <input
              type="month"
              name="targetMonth"
              value={formData.targetMonth}
              onChange={handleInputChange}
              required
              className={`w-full max-w-xs sm:max-w-sm px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.targetMonth ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.targetMonth && <p className="text-red-500 text-sm mt-1 text-center">{errors.targetMonth}</p>}
          </div>

          <div className="w-full max-w-full flex flex-col items-center">
            <label className="block text-sm font-medium mb-2 text-center">{safeT('common.budget', currentLanguage, '予算')} *</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              required
              className={`w-full max-w-xs sm:max-w-sm px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.budget ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="100000"
              min="0"
            />
            {errors.budget && <p className="text-red-500 text-sm mt-1 text-center">{errors.budget}</p>}
          </div>

          <div className="w-full max-w-full flex flex-col items-center">
            <label className="block text-sm font-medium mb-2 text-center">{safeT('dataInput.currency', currentLanguage, '通貨')} *</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              required
              className={`w-full max-w-xs sm:max-w-sm px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.currency ? 'border-red-500' : 'border-gray-600'
              }`}
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
            {errors.currency && <p className="text-red-500 text-sm mt-1 text-center">{errors.currency}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {safeT('common.save', currentLanguage, '保存')}
          </button>
        </form>
      </div>
    </div>
  );
} 
