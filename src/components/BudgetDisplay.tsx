import { useExpenseStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { convertToJPY } from '@/lib/currency';
import { useState, useEffect } from 'react';

interface BudgetDisplayProps {
  userInfo: {
    budget: number;
    email: string;
  };
  currentLanguage: 'ja' | 'en';
}

export default function BudgetDisplay({ userInfo, currentLanguage }: BudgetDisplayProps) {
  const expenses = useExpenseStore((state) => state.expenses);

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
    const updateTotals = async () => {
      const total = await calculateTotalRegistered();
      setTotalRegistered(total);
      setRemainingBudget(userInfo.budget - total);
    };
    updateTotals();
  }, [expenses, userInfo.budget]);

  // 残予算がマイナスの場合は赤色で表示
  const remainingColor = remainingBudget < 0 ? 'text-red-500' : 'text-green-400';

  return (
    <div className="text-center">
      <div className={`text-lg sm:text-xl font-semibold ${remainingColor}`}>
        {t('budgetDisplay.remaining', currentLanguage)}: ¥{remainingBudget.toLocaleString()}
      </div>
      <div className="text-sm text-gray-400 mt-1">
        ({t('budgetDisplay.budget', currentLanguage)} ¥{userInfo.budget.toLocaleString()} - {t('budgetDisplay.registered', currentLanguage)} ¥{totalRegistered.toLocaleString()})
      </div>
    </div>
  );
} 
