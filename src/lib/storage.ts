import { ExpenseData } from '@/types';

// サーバーサイドレンダリング対応のストレージ関数
// すべての必要な関数を確実にエクスポート

// localStorageが利用可能かチェック
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// メールアドレスベースのキー生成
const getUserKey = (email: string, dataType: string): string => {
  return `user_${email}_${dataType}`;
};

// 同期イベントの発火
const triggerSync = (email: string, dataType: string): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storage-sync', {
      detail: { email, dataType }
    }));
  }
};

export const addExpenseToStorage = (expense: ExpenseData, userEmail?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'expenses') : 'expenses';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push(expense);
    localStorage.setItem(key, JSON.stringify(current));
    
    if (userEmail) {
      triggerSync(userEmail, 'expenses');
    }
  } catch (error) {
    console.error('経費データの追加エラー:', error);
  }
};

export const updateExpenseInStorage = (expense: ExpenseData, userEmail?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'expenses') : 'expenses';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.map((e: ExpenseData) => e.id === expense.id ? expense : e);
    localStorage.setItem(key, JSON.stringify(updated));
    
    if (userEmail) {
      triggerSync(userEmail, 'expenses');
    }
  } catch (error) {
    console.error('経費データの更新エラー:', error);
  }
};

export const deleteExpenseFromStorage = (id: string, userEmail?: string, date?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'expenses') : 'expenses';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = current.filter((e: ExpenseData) => e.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    
    if (userEmail) {
      triggerSync(userEmail, 'expenses');
    }
  } catch (error) {
    console.error('経費データの削除エラー:', error);
  }
};

export const loadAllExpenses = (userEmail?: string): ExpenseData[] => {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'expenses') : 'expenses';
    const data = localStorage.getItem(key);
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

export const loadMonthlyExpenses = (year: number, month: number, userEmail?: string): ExpenseData[] => {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const allExpenses = loadAllExpenses(userEmail);
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

export const saveSettings = (settings: any, userEmail?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'settings') : 'user_info';
    localStorage.setItem(key, JSON.stringify(settings));
    
    if (userEmail) {
      triggerSync(userEmail, 'settings');
    }
  } catch (error) {
    console.error('設定の保存エラー:', error);
  }
};

export const loadSettings = (userEmail?: string): any => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'settings') : 'user_info';
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
    return null;
  }
};

// OCR結果の保存
export const saveOCRResult = (ocrResult: any, userEmail?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'ocr_results') : 'ocr_results';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({
      ...ocrResult,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(current));
    
    if (userEmail) {
      triggerSync(userEmail, 'ocr_results');
    }
  } catch (error) {
    console.error('OCR結果の保存エラー:', error);
  }
};

// 予算最適化結果の保存
export const saveOptimizationResult = (result: any, userEmail?: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const key = userEmail ? getUserKey(userEmail, 'optimization_results') : 'optimization_results';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(current));
    
    if (userEmail) {
      triggerSync(userEmail, 'optimization_results');
    }
  } catch (error) {
    console.error('最適化結果の保存エラー:', error);
  }
};

// ユーザー別データの完全削除
export const clearUserData = (userEmail: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const dataTypes = ['expenses', 'settings', 'ocr_results', 'optimization_results'];
    dataTypes.forEach(dataType => {
      const key = getUserKey(userEmail, dataType);
      localStorage.removeItem(key);
    });
    
    triggerSync(userEmail, 'all');
  } catch (error) {
    console.error('ユーザーデータの削除エラー:', error);
  }
}; 

// メールアドレスベースの自動復元機能を追加
export const loadUserDataByEmail = async (email: string): Promise<any> => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const settings = loadSettings(email);
    const expenses = loadAllExpenses(email);
    const ocrResults = JSON.parse(localStorage.getItem(getUserKey(email, 'ocr_results')) || '[]');
    const optimizationResults = JSON.parse(localStorage.getItem(getUserKey(email, 'optimization_results')) || '[]');
    
    return {
      settings,
      expenses,
      ocrResults,
      optimizationResults
    };
  } catch (error) {
    console.error('ユーザーデータの読み込みエラー:', error);
    return null;
  }
};

// メールアドレス変更時のデータ移行
export const migrateUserData = (oldEmail: string, newEmail: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const dataTypes = ['expenses', 'settings', 'ocr_results', 'optimization_results'];
    
    dataTypes.forEach(dataType => {
      const oldKey = getUserKey(oldEmail, dataType);
      const newKey = getUserKey(newEmail, dataType);
      const data = localStorage.getItem(oldKey);
      
      if (data) {
        localStorage.setItem(newKey, data);
        localStorage.removeItem(oldKey);
      }
    });
    
    console.log(`データ移行完了: ${oldEmail} → ${newEmail}`);
  } catch (error) {
    console.error('データ移行エラー:', error);
  }
}; 
