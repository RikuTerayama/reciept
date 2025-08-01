'use client';

import { useExpenseStore } from '@/lib/store';
import { t, getCurrentLanguage } from '@/lib/i18n';
import { convertToJPY } from '@/lib/currency';
import { useState, useEffect } from 'react';

interface BudgetDisplayProps {
  userInfo?: {
    budget: number;
    email: string;
  };
  currentLanguage?: 'ja' | 'en';
}

export default function BudgetDisplay({ userInfo: propUserInfo, currentLanguage: propCurrentLanguage }: BudgetDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'ja' | 'en'>('ja');
  
  const expenses = useExpenseStore((state) => state.expenses);

  // クライアントサイド判定と初期化
  useEffect(() => {
    setIsClient(true);
    setCurrentLanguage(propCurrentLanguage || getCurrentLanguage());
    
    // userInfoがpropsで渡されていない場合はlocalStorageから取得
    if (!propUserInfo) {
      try {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          setUserInfo(JSON.parse(savedUserInfo));
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
      }
    } else {
      setUserInfo(propUserInfo);
    }
  }, [propUserInfo, propCurrentLanguage]);

  // 登録済み経費の合計金額を計算（通貨換算込み）
  const calculateTotalRegistered = async () => {
    let total = 0;
    for (const expense of expenses) {
      if (expense.currency && expense.currency !== 'JPY') {
        total += await convertToJPY(expense.totalAmount, expense.currency);
      } else {
        total += expense.totalAmount;
      }
    }
    return total;
  };

  const [totalRegistered, setTotalRegistered] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);

  useEffect(() => {
    if (!isClient || !userInfo) return;

    const updateTotals = async () => {
      try {
        const total = await calculateTotalRegistered();
        setTotalRegistered(total);
        setRemainingBudget(userInfo.budget - total);
      } catch (error) {
        console.error('Failed to calculate totals:', error);
      }
    };
    updateTotals();
  }, [expenses, userInfo, isClient]);

  // クライアントサイドでない場合、またはuserInfoがない場合は何も表示しない
  if (!isClient || !userInfo) {
    return null;
  }

  // 残予算がマイナスの場合は赤色で表示
  const remainingColor = remainingBudget < 0 ? 'text-red-500' : 'text-green-400';

  return (
    <div className="bg-surface-800 rounded-lg p-6 border border-surface-700 mb-8">
      <div className="text-center">
        <div className={`text-lg sm:text-xl font-semibold ${remainingColor}`}>
          {t('budgetDisplay.remaining', currentLanguage, '残予算')}: ¥{remainingBudget.toLocaleString()}
        </div>
        <div className="text-sm text-surface-400 mt-1">
                      ({t('budgetDisplay.budget', currentLanguage, '予算')} ¥{userInfo.budget.toLocaleString()} - {t('budgetDisplay.registered', currentLanguage, '登録済み')} ¥{totalRegistered.toLocaleString()})
        </div>
      </div>
    </div>
  );
} 
