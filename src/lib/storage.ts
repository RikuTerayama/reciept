import { UserInfo, ExpenseData } from '@/types';

// ユーザー情報の保存
export const saveUserInfo = (userInfo: UserInfo): void => {
  try {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  } catch (error) {
    console.error('Failed to save user info:', error);
  }
};

// ユーザー情報の取得
export const getUserInfo = (): UserInfo | null => {
  try {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

// 経費データの保存
export const saveExpenses = (expenses: ExpenseData[]): void => {
  try {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses:', error);
  }
};

// 経費データの取得
export const getExpenses = (): ExpenseData[] => {
  try {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to get expenses:', error);
    return [];
  }
};

// 経費データの追加
export const addExpense = (expense: ExpenseData): void => {
  try {
    const expenses = getExpenses();
    expenses.push(expense);
    saveExpenses(expenses);
  } catch (error) {
    console.error('Failed to add expense:', error);
  }
};

// 経費データの更新
export const updateExpense = (id: string, updatedExpense: Partial<ExpenseData>): void => {
  try {
    const expenses = getExpenses();
    const index = expenses.findIndex(expense => expense.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updatedExpense };
      saveExpenses(expenses);
    }
  } catch (error) {
    console.error('Failed to update expense:', error);
  }
};

// 経費データの削除
export const deleteExpense = (id: string): void => {
  try {
    const expenses = getExpenses();
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    saveExpenses(filteredExpenses);
  } catch (error) {
    console.error('Failed to delete expense:', error);
  }
};

// 全データのクリア
export const clearAllData = (): void => {
  try {
    localStorage.removeItem('user_info');
    localStorage.removeItem('expenses');
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
};

// データのエクスポート
export const exportData = (): { userInfo: UserInfo | null; expenses: ExpenseData[] } => {
  return {
    userInfo: getUserInfo(),
    expenses: getExpenses()
  };
};

// データのインポート
export const importData = (data: { userInfo: UserInfo | null; expenses: ExpenseData[] }): void => {
  try {
    if (data.userInfo) {
      saveUserInfo(data.userInfo);
    }
    if (data.expenses) {
      saveExpenses(data.expenses);
    }
  } catch (error) {
    console.error('Failed to import data:', error);
  }
}; 
