import { UserInfo, ExpenseData } from '@/types';

// ユーザーデータの同期
export const syncUserData = async (uid: string, userData: UserInfo) => {
  try {
    // ここでFirestoreにユーザーデータを保存
    console.log('Syncing user data:', userData);
    return true;
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw error;
  }
};

// 経費データの同期
export const syncExpenseData = async (uid: string, expenses: ExpenseData[]) => {
  try {
    // ここでFirestoreに経費データを保存
    console.log('Syncing expense data:', expenses.length, 'items');
    return true;
  } catch (error) {
    console.error('Error syncing expense data:', error);
    throw error;
  }
};

// ユーザーデータの復元
export const restoreUserData = async (uid: string): Promise<{ userData: UserInfo; expenses: ExpenseData[] }> => {
  try {
    // ここでFirestoreからユーザーデータを取得
    console.log('Restoring user data for:', uid);
    
    // 仮のデータを返す
    const userData: UserInfo = {
      uid,
      email: 'user@example.com',
      targetMonth: '2025-01',
      budget: 100000,
      currency: 'JPY',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const expenses: ExpenseData[] = [];
    
    return { userData, expenses };
  } catch (error) {
    console.error('Error restoring user data:', error);
    throw error;
  }
};

// オフライン時のデータ保存
export const saveOfflineData = (expenses: ExpenseData[]) => {
  try {
    localStorage.setItem('offlineExpenses', JSON.stringify(expenses));
    console.log('Saved offline data:', expenses.length, 'items');
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

// オンライン復帰時の同期
export const syncOnOnline = async (uid: string) => {
  try {
    const offlineData = localStorage.getItem('offlineExpenses');
    if (offlineData) {
      const expenses = JSON.parse(offlineData);
      await syncExpenseData(uid, expenses);
      localStorage.removeItem('offlineExpenses');
      console.log('Synced offline data on online');
    }
  } catch (error) {
    console.error('Error syncing on online:', error);
  }
};

// 全データのクリア
export const clearAllData = () => {
  try {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('offlineExpenses');
    localStorage.removeItem('expenses');
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// ネットワークリスナーの設定
export const setupNetworkListener = () => {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    console.log('Network online');
  };

  const handleOffline = () => {
    console.log('Network offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}; 
