'use client';

import React, { useState, useEffect } from 'react';
import { User, Calendar, Building, DollarSign, Mail, Save } from 'lucide-react';
import { DEPARTMENTS } from '@/types';
import { t } from '@/lib/i18n';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

interface UserSetupProps {
  onComplete: (userInfo: UserInfo) => void;
}

export default function UserSetup({ onComplete }: UserSetupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    targetMonth: new Date().toISOString().slice(0, 7), // YYYY-MM形式
    department: '',
    budget: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 保存されたユーザー情報があれば読み込み
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
      } catch (error) {
        console.error('Failed to parse saved user info:', error);
      }
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userInfo.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!userInfo.targetMonth) {
      newErrors.targetMonth = '対象月は必須です';
    }

    if (!userInfo.department) {
      newErrors.department = '所属組織は必須です';
    }

    if (userInfo.budget <= 0) {
      newErrors.budget = '予算は0より大きい値を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // ローカルストレージに保存
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      onComplete(userInfo);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card animate-slide-in">
          <div className="card-header text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">ユーザー設定</h1>
            </div>
            <p className="text-gray-300">経費管理を開始する前に、基本情報を設定してください</p>
          </div>

          <form onSubmit={handleSubmit} className="card-body space-y-6">
            {/* メールアドレス */}
            <div className="form-group">
              <label className="form-label">
                <Mail className="w-4 h-4" />
                メールアドレス <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="example@company.com"
                required
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* 対象月 */}
            <div className="form-group">
              <label className="form-label">
                <Calendar className="w-4 h-4" />
                対象月 <span className="text-red-400">*</span>
              </label>
              <input
                type="month"
                value={userInfo.targetMonth}
                onChange={(e) => setUserInfo(prev => ({ ...prev, targetMonth: e.target.value }))}
                className={`form-input ${errors.targetMonth ? 'error' : ''}`}
                required
              />
              {errors.targetMonth && <p className="form-error">{errors.targetMonth}</p>}
            </div>

            {/* 所属組織 */}
            <div className="form-group">
              <label className="form-label">
                <Building className="w-4 h-4" />
                所属組織 <span className="text-red-400">*</span>
              </label>
              <select
                value={userInfo.department}
                onChange={(e) => setUserInfo(prev => ({ ...prev, department: e.target.value }))}
                className={`form-select ${errors.department ? 'error' : ''}`}
                required
              >
                <option value="">組織を選択してください</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="form-error">{errors.department}</p>}
            </div>

            {/* 予算 */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign className="w-4 h-4" />
                自身の予算 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={userInfo.budget}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                  className={`form-input pr-12 ${errors.budget ? 'error' : ''}`}
                  placeholder="100000"
                  min="0"
                  step="1000"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  JPY
                </span>
              </div>
              {errors.budget && <p className="form-error">{errors.budget}</p>}
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>設定を保存して開始</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
