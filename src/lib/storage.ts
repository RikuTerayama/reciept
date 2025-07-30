import { ExpenseData } from '@/types';

// 簡易版のストレージ関数
// すべての必要な関数を確実にエクスポート

export const addExpenseToStorage = (expense: ExpenseData): void => {
  try {
    const current = JSON.parse(localStorage.getItem('expenses') || '[]');
    current.push(expense);
    localStorage.setItem('expenses', JSON.stringify(current));
  } catch (error) {
    console.error('経費データの追加エラー:', error);
  }
};

export const updateExpenseInStorage = (expense: ExpenseData): void => {
  try {
    const current = JSON.parse(localStorage.getItem('expenses') || '[]');
    const updated = current.map((e: ExpenseData) => e.id === expense.id ? expense : e);
    localStorage.setItem('expenses', JSON.stringify(updated));
  } catch (error) {
    console.error('経費データの更新エラー:', error);
  }
};

export const deleteExpenseFromStorage = (id: string, date?: string): void => {
  try {
    const current = JSON.parse(localStorage.getItem('expenses') || '[]');
    const filtered = current.filter((e: ExpenseData) => e.id !== id);
    localStorage.setItem('expenses', JSON.stringify(filtered));
  } catch (error) {
    console.error('経費データの削除エラー:', error);
  }
};

export const loadAllExpenses = (): ExpenseData[] => {
  try {
    const data = localStorage.getItem('expenses');
    if (data) {
      const expenses = JSON.parse(data);
      return expenses.map((expense: ExpenseData) => ({
        ...expense,
        createdAt: new Date(expense.createdAt)
      }));
    }
    return [];
  } catch (error) {
    console.error('全データの読み込みエラー:', error);
    return [];
  }
};

export const loadMonthlyExpenses = (year: number, month: number): ExpenseData[] => {
  try {
    const allExpenses = loadAllExpenses();
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    return allExpenses.filter((expense: ExpenseData) => 
      expense.date && expense.date.startsWith(yearMonth)
    );
  } catch (error) {
    console.error('月別データの読み込みエラー:', error);
    return [];
  }
};

export const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

export const getYearMonthFromDate = (dateString: string): { year: number; month: number } => {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
};

// 追加のユーティリティ関数
export const saveSettings = (settings: any): void => {
  try {
    localStorage.setItem('user_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('設定の保存エラー:', error);
  }
};

export const loadSettings = (): any => {
  try {
    const data = localStorage.getItem('user_settings');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
    return {};
  }
}; 
