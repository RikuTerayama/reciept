import { ExpenseData, UserInfo } from '@/types';

// デバウンス関数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 差分検出関数
export const getChangedExpenses = (
  oldExpenses: ExpenseData[],
  newExpenses: ExpenseData[]
): ExpenseData[] => {
  const changed: ExpenseData[] = [];
  const oldMap = new Map(oldExpenses.map(exp => [exp.id, exp]));
  
  newExpenses.forEach(expense => {
    const oldExpense = oldMap.get(expense.id);
    if (!oldExpense || hasExpenseChanged(oldExpense, expense)) {
      changed.push(expense);
    }
  });
  
  return changed;
};

// 経費データの変更検出
const hasExpenseChanged = (old: ExpenseData, new_: ExpenseData): boolean => {
  const fieldsToCompare = [
    'totalAmount',
    'category',
    'description',
    'taxRate',
    'participantFromClient',
    'participantFromCompany',
    'isQualified',
    'currency',
    'convertedAmount'
  ];
  
  return fieldsToCompare.some(field => 
    old[field as keyof ExpenseData] !== new_[field as keyof ExpenseData]
  );
};

// ユーザーデータの変更検出
export const hasUserDataChanged = (old: UserInfo, new_: UserInfo): boolean => {
  return (
    old.email !== new_.email ||
    old.targetMonth !== new_.targetMonth ||
    old.budget !== new_.budget ||
    old.currency !== new_.currency
  );
};

// バッチ処理用のキュー
export class SyncQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private batchSize = 10;
  private batchDelay = 500;

  async add(syncFunction: () => Promise<void>): Promise<void> {
    this.queue.push(syncFunction);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(fn => fn()));
      
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.batchDelay);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  clear(): void {
    this.queue = [];
  }
}

// SWRキャッシュキー生成
export const generateCacheKey = (uid: string, dataType: string): string => {
  return `sync-${dataType}-${uid}`;
};

// キャッシュ有効期限チェック
export const isCacheValid = (timestamp: number, maxAge: number = 5 * 60 * 1000): boolean => {
  return Date.now() - timestamp < maxAge;
};

// 同期状態の管理
export interface SyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  error: string | null;
}

export class SyncStateManager {
  private state: SyncState = {
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
    error: null
  };
  
  private listeners: Array<(state: SyncState) => void> = [];

  getState(): SyncState {
    return { ...this.state };
  }

  setState(updates: Partial<SyncState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  startSync(): void {
    this.setState({ isSyncing: true, error: null });
  }

  finishSync(success: boolean, error?: string): void {
    this.setState({
      isSyncing: false,
      lastSync: success ? new Date() : this.state.lastSync,
      error: error || null
    });
  }

  incrementPendingChanges(): void {
    this.setState({ pendingChanges: this.state.pendingChanges + 1 });
  }

  decrementPendingChanges(): void {
    this.setState({ pendingChanges: Math.max(0, this.state.pendingChanges - 1) });
  }
}

// グローバル同期状態マネージャー
export const syncStateManager = new SyncStateManager();
export const syncQueue = new SyncQueue(); 
