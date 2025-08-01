'use client';

import React, { useState } from 'react';
import { getCurrentLanguage, t } from '@/lib/i18n';

interface UserInfo {
  email: string;
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
    targetMonth: '',
    budget: 0,
    currency: 'JPY'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentLanguage = getCurrentLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) || 0 : value
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
              newErrors.email = t('dataInput.validation.required', currentLanguage, 'この項目は必須です');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
              newErrors.email = t('dataInput.validation.invalidEmail', currentLanguage, '有効なメールアドレスを入力してください');
    }

    if (!formData.targetMonth) {
              newErrors.targetMonth = t('dataInput.validation.required', currentLanguage, 'この項目は必須です');
    }

    if (!formData.budget || formData.budget <= 0) {
              newErrors.budget = t('dataInput.validation.invalidAmount', currentLanguage, '有効な金額を入力してください');
    }

    if (!formData.currency) {
              newErrors.currency = t('dataInput.validation.required', currentLanguage, 'この項目は必須です');
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
                  <h2 className="text-3xl font-bold mb-4">{t('welcome.title', currentLanguage, 'Welcome')}</h2>
        <p className="text-xl text-gray-400">{t('welcome.description', currentLanguage, 'OCR技術による自動抽出・管理')}</p>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-2xl font-semibold mb-6">{t('common.settings', currentLanguage, '設定')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('common.email', currentLanguage, 'メールアドレス')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="example@company.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('common.targetMonth', currentLanguage, '対象月')} *</label>
            <input
              type="month"
              name="targetMonth"
              value={formData.targetMonth}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.targetMonth ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.targetMonth && <p className="text-red-500 text-sm mt-1">{errors.targetMonth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('common.budget', currentLanguage, '予算')} *</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.budget ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="100000"
              min="0"
            />
            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.currency', currentLanguage, '通貨')} *</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
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
            {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.save', currentLanguage, '保存')}
          </button>
        </form>
      </div>
    </div>
  );
} 
