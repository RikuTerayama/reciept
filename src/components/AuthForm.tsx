'use client';

import React, { useState } from 'react';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { registerUser, loginUser } from '@/lib/auth-service';
import { UserInfo } from '@/types';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: (userInfo: UserInfo) => void;
  onCancel?: () => void;
}

export default function AuthForm({ mode, onSuccess, onCancel }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    targetMonth: '',
    budget: 100000,
    currency: 'JPY'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
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
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'パスワードが一致しません';
      }

      if (!formData.targetMonth) {
        newErrors.targetMonth = '対象月を選択してください';
      }

      if (!formData.budget || formData.budget <= 0) {
        newErrors.budget = '有効な予算金額を入力してください';
      }
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
      if (mode === 'register') {
        const userData = {
          email: formData.email,
          targetMonth: formData.targetMonth,
          budget: formData.budget,
          currency: formData.currency
        };
        
        const userInfo = await registerUser(formData.email, formData.password, userData);
        onSuccess(userInfo);
      } else {
        const userInfo = await loginUser(formData.email, formData.password);
        onSuccess(userInfo);
      }
    } catch (error: any) {
      // Firebase Auth エラーの詳細ハンドリング
      const errorMessage = getAuthErrorMessage(error.message);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Auth エラーメッセージの日本語化
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'このメールアドレスは登録されていません';
      case 'auth/wrong-password':
        return 'パスワードが正しくありません';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません';
      case 'auth/weak-password':
        return 'パスワードは6文字以上で入力してください';
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています';
      case 'auth/network-request-failed':
        return 'ネットワークに接続できません。再度お試しください';
      case 'auth/too-many-requests':
        return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください';
      case 'auth/user-disabled':
        return 'このアカウントは無効になっています';
      default:
        return errorCode || '認証に失敗しました。再度お試しください';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'login' ? 'ログイン' : '新規登録'}
        </h2>
        <p className="text-surface-400">
          {mode === 'login' 
            ? 'アカウントにログインしてデータを復元' 
            : '新しいアカウントを作成してデータを保存'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            メールアドレス *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
              errors.email ? 'border-red-500' : 'border-surface-600'
            }`}
            placeholder="example@company.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-surface-300">
            パスワード *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
              errors.password ? 'border-red-500' : 'border-surface-600'
            }`}
            placeholder="6文字以上"
          />
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-surface-300">
                パスワード確認 *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-surface-600'
                }`}
                placeholder="パスワードを再入力"
              />
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-surface-300">
                対象月 *
              </label>
              <input
                type="month"
                name="targetMonth"
                value={formData.targetMonth}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.targetMonth ? 'border-red-500' : 'border-surface-600'
                }`}
              />
              {errors.targetMonth && <p className="text-red-400 text-sm mt-1">{errors.targetMonth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-surface-300">
                予算金額 *
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.budget ? 'border-red-500' : 'border-surface-600'
                }`}
                placeholder="100000"
                min="0"
              />
              {errors.budget && <p className="text-red-400 text-sm mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-surface-300">
                基軸通貨 *
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                required
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
          </>
        )}

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
          </button>
        </div>
      </form>
    </div>
  );
} 
