import { useExpenseStore } from '@/lib/store';
import { t } from '@/lib/i18n';

interface BudgetDisplayProps {
  userInfo: {
    budget: number;
    email: string;
  };
}

export default function BudgetDisplay({ userInfo }: BudgetDisplayProps) {
  const expenses = useExpenseStore((state) => state.expenses);
  const currentLanguage = 'ja'; // 言語設定は後で動的に取得

  // 登録済み経費の合計金額を計算
  const totalRegistered = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  
  // 残予算を計算
  const remainingBudget = userInfo.budget - totalRegistered;
  
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
