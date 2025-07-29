'use client';

import React, { useState } from 'react';
import { User, Calendar, DollarSign } from 'lucide-react';

interface UserInfo {
  email: string;
  targetMonth: string;
  budget: number;
}

interface UserSetupProps {
  onSave: (userInfo: UserInfo) => void;
}

export default function UserSetup({ onSave }: UserSetupProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: '',
    targetMonth: '',
    budget: 0
  });

  const [errors, setErrors] = useState<Partial<UserInfo>>({});

  const validateForm = () => {
    const newErrors: Partial<UserInfo> = {};

    if (!userInfo.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!userInfo.targetMonth) {
      newErrors.targetMonth = '対象月は必須です';
    }

    if (!userInfo.budget || userInfo.budget <= 0) {
      newErrors.budget = '予算は0より大きい値を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(userInfo);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        初期設定
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            メールアドレス
          </label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="example@company.com"
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            対象月
          </label>
          <input
            type="month"
            value={userInfo.targetMonth}
            onChange={(e) => setUserInfo(prev => ({ ...prev, targetMonth: e.target.value }))}
            className={`form-input ${errors.targetMonth ? 'error' : ''}`}
          />
          {errors.targetMonth && <p className="form-error">{errors.targetMonth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            予算
          </label>
          <input
            type="number"
            value={userInfo.budget}
            onChange={(e) => setUserInfo(prev => ({ ...prev, budget: Number(e.target.value) }))}
            className={`form-input ${errors.budget ? 'error' : ''}`}
            placeholder="100000"
          />
          {errors.budget && <p className="form-error">{errors.budget}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          設定を保存
        </button>
      </form>
    </div>
  );
} 
