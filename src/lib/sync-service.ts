import { auth, db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  orderBy,
  limit 
} from 'firebase/firestore';
import { UserInfo, ExpenseData } from '@/types';
import { clearExchangeRateCache } from './exchange-rate-cache';

// ローカルストレージキー
const LOCAL_USER_KEY = 'localUserData';
const LOCAL_EXPENSES_KEY = 'localExpenses';
const SYNC_TIMESTAMP_KEY = 'lastSyncTimestamp';

// データ同期状態
export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
}

// ローカルデータの取得
export const getLocalUserData = (): UserInfo | null => {
  try {
    const data = localStorage.getItem(LOCAL_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading local user data:', error);
    return null;
  }
};

// ローカルデータの保存
export const saveLocalUserData = (userData: UserInfo): void => {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving local user data:', error);
  }
};

// ローカル経費データの取得
export const getLocalExpenses = (): ExpenseData[] => {
  try {
    const data = localStorage.getItem(LOCAL_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local expenses:', error);
    return [];
  }
};

// ローカル経費データの保存
export const saveLocalExpenses = (expenses: ExpenseData[]): void => {
  try {
    localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving local expenses:', error);
  }
};

// オンライン状態の確認
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// ユーザーデータの同期
export const syncUserData = async (uid: string, localUserData: UserInfo): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // クラウドにデータがある場合、新しい方を採用
      const cloudData = userDoc.data() as UserInfo;
      const localTimestamp = new Date(localUserData.updatedAt || 0);
      const cloudTimestamp = new Date(cloudData.updatedAt || 0);
      
      if (localTimestamp > cloudTimestamp) {
        // ローカルが新しい場合、クラウドにアップロード
        await updateDoc(userRef, {
          ...localUserData,
          updatedAt: new Date()
        });
      } else {
        // クラウドが新しい場合、ローカルに復元
        saveLocalUserData(cloudData);
      }
    } else {
      // クラウドにデータがない場合、ローカルデータをアップロード
      await setDoc(userRef, {
        ...localUserData,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw error;
  }
};

// 経費データの同期
export const syncExpenseData = async (uid: string, localExpenses: ExpenseData[]): Promise<ExpenseData[]> => {
  try {
    // クラウドから経費データを取得
    const expensesQuery = query(
      collection(db, 'users', uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
    const querySnapshot = await getDocs(expensesQuery);
    const cloudExpenses = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ExpenseData[];

    // ローカルとクラウドのデータをマージ
    const mergedExpenses = mergeExpenses(localExpenses, cloudExpenses);
  
  // マージされたデータをクラウドに保存
  const batch = writeBatch(db);
  mergedExpenses.forEach(expense => {
    if (!expense.id.startsWith('local_')) {
      // 既存のクラウドデータは更新
      const expenseRef = doc(db, 'users', uid, 'expenses', expense.id);
      batch.update(expenseRef, {
        ...expense,
        updatedAt: new Date()
      });
    } else {
      // 新しいローカルデータは追加
      const expenseRef = doc(collection(db, 'users', uid, 'expenses'));
      batch.set(expenseRef, {
        ...expense,
        id: undefined, // Firestoreが自動生成
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });
  
  await batch.commit();
  
  // 同期済みデータをローカルに保存
  saveLocalExpenses(mergedExpenses);
  
  return mergedExpenses;
    

  } catch (error) {
    console.error('Error syncing expense data:', error);
    throw error;
  }
};

// 経費データのマージ
const mergeExpenses = (localExpenses: ExpenseData[], cloudExpenses: ExpenseData[]): ExpenseData[] => {
  const merged = new Map<string, ExpenseData>();
  
  // ローカルデータを追加
  localExpenses.forEach(expense => {
    merged.set(expense.id, expense);
  });
  
  // クラウドデータを追加（競合時は新しい方を採用）
  cloudExpenses.forEach(expense => {
    const existing = merged.get(expense.id);
    if (!existing) {
      merged.set(expense.id, expense);
    } else {
      // タイムスタンプで競合解決
      const localTime = new Date(existing.updatedAt || 0);
      const cloudTime = new Date(expense.updatedAt || 0);
      if (cloudTime > localTime) {
        merged.set(expense.id, expense);
      }
    }
  });
  
  return Array.from(merged.values());
};

// 初回ログイン時のデータ復元
export const restoreUserData = async (uid: string): Promise<{ userData: UserInfo; expenses: ExpenseData[] }> => {
  try {
    // ユーザーデータを取得
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data() as UserInfo;
    
    // 経費データを取得
    const expensesQuery = query(
      collection(db, 'users', uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
    const querySnapshot = await getDocs(expensesQuery);
    const expenses = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ExpenseData[];
    
    // ローカルに保存
    saveLocalUserData(userData);
    saveLocalExpenses(expenses);
    
    return { userData, expenses };
  } catch (error) {
    console.error('Error restoring user data:', error);
    throw error;
  }
};

// オフライン時のデータ保存
export const saveOfflineData = (expenses: ExpenseData[]): void => {
  try {
    saveLocalExpenses(expenses);
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

// オンライン復帰時の同期
export const syncOnOnline = async (uid: string): Promise<void> => {
  if (!isOnline()) return;
  
  try {
    const localExpenses = getLocalExpenses();
    const lastSync = localStorage.getItem(SYNC_TIMESTAMP_KEY);
    
    if (lastSync) {
      // 最後の同期以降の変更がある場合、同期を実行
      await syncExpenseData(uid, localExpenses);
      localStorage.removeItem(SYNC_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.error('Error syncing on online:', error);
  }
};

// 完全なデータクリア（ログアウト時）
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_EXPENSES_KEY);
    localStorage.removeItem(SYNC_TIMESTAMP_KEY);
    clearExchangeRateCache();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// ネットワーク状態の監視
export const setupNetworkListener = (onOnline: () => void, onOffline: () => void): (() => void) => {
  const handleOnline = () => {
    console.log('Network: Online');
    onOnline();
  };
  
  const handleOffline = () => {
    console.log('Network: Offline');
    onOffline();
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}; 
