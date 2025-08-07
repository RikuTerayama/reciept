'use client';

import React, { useState } from 'react';
import { UserInfo } from '@/types';
import { registerUser, loginUser } from '@/lib/auth-service';
import { getCurrentLanguage, t, Language } from '@/lib/i18n';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: (userInfo: UserInfo) => void;
  onCancel: () => void;
}

export default function AuthForm({ mode, onSuccess, onCancel }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budget, setBudget] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentLanguage = getCurrentLanguage();

  // t関数の安全性を確保
  const safeT = (key: string, lang: Language = currentLanguage, defaultValue?: string): string => {
    try {
      return t(key, lang, defaultValue);
    } catch (error) {
      console.warn('Translation error:', error);
      return defaultValue || key;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('AuthForm - Starting authentication process...');
      console.log('AuthForm - Mode:', mode);
      console.log('AuthForm - Email:', email);
      console.log('AuthForm - Current language:', currentLanguage);

      if (mode === 'register') {
        // 新規登録
        console.log('AuthForm - Attempting user registration...');
        const userData = {
          email,
          targetMonth,
          budget,
          currency: 'JPY',
          office: 'japan' // デフォルトで日本を設定
        };
        
        console.log('AuthForm - User data:', userData);
        const userInfo = await registerUser(email, password, userData);
        console.log('AuthForm - Registration successful:', userInfo);
        
        // ローカルストレージにユーザー情報を保存
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('AuthForm - User info saved to localStorage');
        
        onSuccess(userInfo);
      } else {
        // ログイン
        console.log('AuthForm - Attempting user login...');
        const userInfo = await loginUser(email, password);
        console.log('AuthForm - Login successful:', userInfo);
        
        // ローカルストレージにユーザー情報を保存
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('AuthForm - User info saved to localStorage');
        
        onSuccess(userInfo);
      }
    } catch (error: any) {
      console.error('AuthForm - Authentication error:', error);
      console.error('AuthForm - Error message:', error.message);
      console.error('AuthForm - Error stack:', error.stack);
      
      // エラーメッセージの生成
      let errorMessage = '認証に失敗しました';
      try {
        errorMessage = error.message || safeT('auth.error', currentLanguage, '認証に失敗しました');
      } catch (translationError) {
        console.error('AuthForm - Translation error:', translationError);
        errorMessage = error.message || '認証に失敗しました';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div className="w-full max-w-full">
        <label className="block text-sm font-medium mb-2 text-surface-300">
          {safeT('common.email', currentLanguage, 'メールアドレス')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          placeholder="example@company.com"
        />
      </div>
      
      <div className="w-full max-w-full">
        <label className="block text-sm font-medium mb-2 text-surface-300">
          {safeT('common.password', currentLanguage, 'パスワード')}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          placeholder={safeT('auth.passwordPlaceholder', currentLanguage, 'パスワードを入力')}
          minLength={6}
        />
      </div>

      {mode === 'register' && (
        <>
          <div className="w-full max-w-full">
                    <label className="block text-sm font-medium mb-2 text-surface-300">
          {safeT('common.targetMonth', currentLanguage, '対象月')} *
        </label>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              required
              className="w-full max-w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              style={{ minWidth: '0', width: '100%' }}
            />
          </div>

          <div className="w-full max-w-full">
                    <label className="block text-sm font-medium mb-2 text-surface-300">
          {safeT('common.budget', currentLanguage, '予算')} *
        </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              required
              className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="100000"
              min="0"
            />
          </div>
        </>
      )}
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? safeT('common.processing', currentLanguage, '処理中...') : mode === 'login' ? safeT('auth.login', currentLanguage, 'ログイン') : safeT('auth.register', currentLanguage, '新規登録')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium"
        >
          {safeT('common.cancel', currentLanguage, 'キャンセル')}
        </button>
      </div>
    </form>
  );
} 
