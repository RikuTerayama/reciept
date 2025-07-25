import { ExpenseData } from '@/types';

// ストレージキーのプレフィックス
const STORAGE_PREFIX = 'receipt_expense_manager';
const EXPENSES_KEY = `${STORAGE_PREFIX}_expenses`;
const SETTINGS_KEY = `${STORAGE_PREFIX}_settings`;

interface UserSettings {
  email?: string;
  targetMonth?: string;
  department?: string;
  budget?: number;
  language?: string;
  [key: string]: any;
}

// 月別データのキーを生成
function getMonthlyKey(year: number, month: number): string {
  return `${STORAGE_PREFIX}_expenses_${year}_${month.toString().padStart(2, '0')}`;
}

// 現在の年月を取得
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

// 日付から年月を取得
export function getYearMonthFromDate(dateString: string): { year: number; month: number } {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
}

// ローカルストレージから月別データを読み込み
export function loadMonthlyExpenses(year: number, month: number): ExpenseData[] {
  try {
    const key = getMonthlyKey(year, month);
    const data = localStorage.getItem(key);
    
    if (data) {
      const expenses = JSON.parse(data);
      // 日付文字列をDateオブジェクトに変換
      return expenses.map((expense: ExpenseData) => ({
        ...expense,
        createdAt: new Date(expense.createdAt)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('月別データの読み込みエラー:', error);
    return [];
  }
}

// ローカルストレージに月別データを保存
export function saveMonthlyExpenses(year: number, month: number, expenses: ExpenseData[]): void {
  try {
    const key = getMonthlyKey(year, month);
    localStorage.setItem(key, JSON.stringify(expenses));
    
    // 月別データのインデックスを更新
    updateMonthlyIndex(year, month);
  } catch (error) {
    console.error('月別データの保存エラー:', error);
  }
}

// 月別データのインデックスを管理
function updateMonthlyIndex(year: number, month: number): void {
  try {
    const indexKey = `${STORAGE_PREFIX}_monthly_index`;
    const existingIndex = localStorage.getItem(indexKey);
    const index = existingIndex ? JSON.parse(existingIndex) : [];
    
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    if (!index.includes(yearMonth)) {
      index.push(yearMonth);
      index.sort(); // 年月順にソート
      localStorage.setItem(indexKey, JSON.stringify(index));
    }
  } catch (error) {
    console.error('月別インデックスの更新エラー:', error);
  }
}

// 利用可能な月別データの一覧を取得
export function getAvailableMonths(): string[] {
  try {
    const indexKey = `${STORAGE_PREFIX}_monthly_index`;
    const data = localStorage.getItem(indexKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('月別データ一覧の取得エラー:', error);
    return [];
  }
}

// 全月のデータを統合して取得
export function loadAllExpenses(): ExpenseData[] {
  try {
    const months = getAvailableMonths();
    const allExpenses: ExpenseData[] = [];
    
    for (const monthKey of months) {
      const [year, month] = monthKey.split('-').map(Number);
      const monthlyExpenses = loadMonthlyExpenses(year, month);
      allExpenses.push(...monthlyExpenses);
    }
    
    // 作成日時でソート
    return allExpenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('全データの読み込みエラー:', error);
    return [];
  }
}

// 経費データを追加（月別に自動分類）
export function addExpenseToStorage(expense: ExpenseData): void {
  try {
    const { year, month } = getYearMonthFromDate(expense.date);
    const existingExpenses = loadMonthlyExpenses(year, month);
    
    // 新しい経費を追加
    existingExpenses.push(expense);
    
    // 月別データを保存
    saveMonthlyExpenses(year, month, existingExpenses);
  } catch (error) {
    console.error('経費データの追加エラー:', error);
  }
}

// 経費データを更新
export function updateExpenseInStorage(updatedExpense: ExpenseData): void {
  try {
    const { year, month } = getYearMonthFromDate(updatedExpense.date);
    const existingExpenses = loadMonthlyExpenses(year, month);
    
    const index = existingExpenses.findIndex(exp => exp.id === updatedExpense.id);
    if (index !== -1) {
      existingExpenses[index] = updatedExpense;
      saveMonthlyExpenses(year, month, existingExpenses);
    }
  } catch (error) {
    console.error('経費データの更新エラー:', error);
  }
}

// 経費データを削除
export function deleteExpenseFromStorage(expenseId: string, date: string): void {
  try {
    const { year, month } = getYearMonthFromDate(date);
    const existingExpenses = loadMonthlyExpenses(year, month);
    
    const filteredExpenses = existingExpenses.filter(exp => exp.id !== expenseId);
    saveMonthlyExpenses(year, month, filteredExpenses);
  } catch (error) {
    console.error('経費データの削除エラー:', error);
  }
}

// 設定の保存
export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('設定の保存エラー:', error);
  }
}

// 設定の読み込み
export function loadSettings(): UserSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
    return {};
  }
}

// データのエクスポート（月別）
export function exportMonthlyData(year: number, month: number): string {
  try {
    const expenses = loadMonthlyExpenses(year, month);
    const exportData = {
      year,
      month,
      expenses,
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('データエクスポートエラー:', error);
    return '';
  }
}

// データのインポート（月別）
export function importMonthlyData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    const { year, month, expenses } = data;
    
    if (year && month && Array.isArray(expenses)) {
      saveMonthlyExpenses(year, month, expenses);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('データインポートエラー:', error);
    return false;
  }
}

// ストレージの使用量をチェック
export function checkStorageUsage(): { used: number; available: number; percentage: number } {
  try {
    let used = 0;
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
    
    // ローカルストレージの制限（通常5MB）
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;
    
    return { used, available, percentage };
  } catch (error) {
    console.error('ストレージ使用量チェックエラー:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

// 古いデータのクリーンアップ
export function cleanupOldData(keepMonths: number = 12): void {
  try {
    const months = getAvailableMonths();
    const currentDate = new Date();
    const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - keepMonths, 1);
    
    for (const monthKey of months) {
      const [year, month] = monthKey.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      
      if (monthDate < cutoffDate) {
        // 古い月のデータを削除
        const key = getMonthlyKey(year, month);
        localStorage.removeItem(key);
        
        // インデックスからも削除
        const indexKey = `${STORAGE_PREFIX}_monthly_index`;
        const existingIndex = localStorage.getItem(indexKey);
        if (existingIndex) {
          const index = JSON.parse(existingIndex);
          const updatedIndex = index.filter((m: string) => m !== monthKey);
          localStorage.setItem(indexKey, JSON.stringify(updatedIndex));
        }
      }
    }
  } catch (error) {
    console.error('古いデータのクリーンアップエラー:', error);
  }
}

// データの同期（将来的なクラウド同期のための準備）
export interface SyncData {
  expenses: ExpenseData[];
  lastSync: string;
  deviceId: string;
}

export function prepareSyncData(): SyncData {
  const allExpenses = loadAllExpenses();
  const deviceId = getDeviceId();
  
  return {
    expenses: allExpenses,
    lastSync: new Date().toISOString(),
    deviceId
  };
}

// デバイスIDの生成
function getDeviceId(): string {
  let deviceId = localStorage.getItem(`${STORAGE_PREFIX}_device_id`);
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(`${STORAGE_PREFIX}_device_id`, deviceId);
  }
  
  return deviceId;
} 
