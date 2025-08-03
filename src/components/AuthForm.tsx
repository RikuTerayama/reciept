'use client';

import React, { useState } from 'react';
import { UserInfo } from '@/types';
import { registerUser, loginUser } from '@/lib/auth-service';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: (userInfo: UserInfo) => void;
  onCancel: () => void;
}

export default function AuthForm({ mode, onSuccess, onCancel }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        // 新規登録
        const userData = {
          email,
          targetMonth: new Date().toISOString().slice(0, 7), // 現在の年月
          budget: 100000,
          currency: 'JPY'
        };
        
        const userInfo = await registerUser(email, password, userData);
        onSuccess(userInfo);
      } else {
        // ログイン
        const userInfo = await loginUser(email, password);
        onSuccess(userInfo);
      }
    } catch (error: any) {
      setError(error.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-2 text-surface-300">
          メールアドレス
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
      
      <div>
        <label className="block text-sm font-medium mb-2 text-surface-300">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-surface-700 border border-surface-600 rounded-lg text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          placeholder="パスワードを入力"
          minLength={6}
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-colors duration-200 font-medium"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
} 
