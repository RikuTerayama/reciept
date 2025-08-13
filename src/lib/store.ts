import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExpenseData, OCRResult } from '@/types';
import { 
  getCurrentYearMonth,
  loadAllExpenses, 
  addExpenseToStorage, 
  updateExpenseInStorage, 
  deleteExpenseFromStorage,
  loadMonthlyExpenses,
  getYearMonthFromDate
} from '@/lib/storage';
import { getMonthKey } from '@/lib/date';
import { getImagesByExpenseId, renameImage } from './imageStorage';

interface ExpenseStore {
  // 状態
  expenses: ExpenseData[];
  selectedExpenses: string[];
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  currentMonth: { year: number; month: number };
  
  // アクション
  addExpense: (expense: ExpenseData) => void;
  updateExpense: (expense: ExpenseData) => void;
  deleteExpense: (id: string) => void;
  deleteExpenses: (ids: string[]) => void;
  setOCRResult: (result: OCRResult | null) => void;
  setProcessing: (processing: boolean) => void;
  toggleExpenseSelection: (id: string) => void;
  clearSelection: () => void;
  selectAllExpenses: () => void;
  loadExpenses: () => void;
  setCurrentMonth: (year: number, month: number) => void;
  loadMonthlyExpenses: (year: number, month: number) => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      expenses: [],
      selectedExpenses: [],
      ocrResult: null,
      isProcessing: false,
      currentMonth: getCurrentYearMonth(),

      // 経費データの追加
      addExpense: (expense: ExpenseData, userEmail?: string) => {
        set((state) => {
          // monthKeyを自動付与
          const expenseWithMonthKey = {
            ...expense,
            monthKey: getMonthKey(expense.date)
          };
          const newExpenses = [...state.expenses, expenseWithMonthKey];
          // ローカルストレージにも保存（同期対応）
          addExpenseToStorage(expenseWithMonthKey, userEmail);
          
          // OCR結果から画像を関連付け
          if (state.ocrResult && state.ocrResult.source === 'ocr') {
            // 関連する画像のexpenseIdを更新
            const relatedImages = getImagesByExpenseId(expense.id);
            relatedImages.forEach(image => {
              if (!image.expenseId) {
                renameImage(image.id, `${expense.id}_${image.originalName}`);
              }
            });
          }
          
          return { expenses: newExpenses };
        });
      },

      // 経費データの更新
      updateExpense: (expense: ExpenseData, userEmail?: string) => {
        set((state) => {
          // monthKeyを再計算
          const updatedExpense = {
            ...expense,
            monthKey: getMonthKey(expense.date)
          };
          const updatedExpenses = state.expenses.map((exp) =>
            exp.id === expense.id ? updatedExpense : exp
          );
          // ローカルストレージにも更新（同期対応）
          updateExpenseInStorage(updatedExpense, userEmail);
          return { expenses: updatedExpenses };
        });
      },

      // 経費データの削除
      deleteExpense: (id: string) => {
        set((state) => {
          const expenseToDelete = state.expenses.find(exp => exp.id === id);
          const filteredExpenses = state.expenses.filter((exp) => exp.id !== id);
          const filteredSelection = state.selectedExpenses.filter((selectedId) => selectedId !== id);
          
          // ローカルストレージからも削除（同期対応）
          if (expenseToDelete) {
            deleteExpenseFromStorage(id, undefined, expenseToDelete.date);
          }
          
          return { 
            expenses: filteredExpenses, 
            selectedExpenses: filteredSelection 
          };
        });
      },

      // 複数経費データの一括削除
      deleteExpenses: (ids: string[]) => {
        set((state) => {
          const idSet = new Set(ids);
          const expensesToDelete = state.expenses.filter(exp => idSet.has(exp.id));
          const filteredExpenses = state.expenses.filter((exp) => !idSet.has(exp.id));
          const filteredSelection = state.selectedExpenses.filter((selectedId) => !idSet.has(selectedId));
          
          // ローカルストレージからも削除（同期対応）
          expensesToDelete.forEach(expense => {
            deleteExpenseFromStorage(expense.id, undefined, expense.date);
          });
          
          return { 
            expenses: filteredExpenses, 
            selectedExpenses: filteredSelection 
          };
        });
      },

      // OCR結果の設定
      setOCRResult: (result: OCRResult | null) => {
        set({ ocrResult: result });
      },

      // 処理状態の設定
      setProcessing: (processing: boolean) => {
        set({ isProcessing: processing });
      },

      // 経費選択の切り替え
      toggleExpenseSelection: (id: string) => {
        set((state) => {
          const isSelected = state.selectedExpenses.includes(id);
          const newSelection = isSelected
            ? state.selectedExpenses.filter((selectedId) => selectedId !== id)
            : [...state.selectedExpenses, id];
          
          return { selectedExpenses: newSelection };
        });
      },

      // 選択のクリア
      clearSelection: () => {
        set({ selectedExpenses: [] });
      },

      // 全選択
      selectAllExpenses: () => {
        set((state) => ({
          selectedExpenses: state.expenses.map((exp) => exp.id)
        }));
      },

      // 全データの読み込み
      loadExpenses: () => {
        const allExpenses = loadAllExpenses();
        set({ expenses: allExpenses });
      },

      // 現在月の設定
      setCurrentMonth: (year: number, month: number) => {
        set({ currentMonth: { year, month } });
      },

      // 月別データの読み込み
      loadMonthlyExpenses: (year: number, month: number) => {
        const monthlyExpenses = loadMonthlyExpenses(year, month);
        set({ 
          expenses: monthlyExpenses,
          currentMonth: { year, month }
        });
      },
    }),
    {
      name: 'expense-store',
      // 永続化する項目を指定
      partialize: (state) => ({
        currentMonth: state.currentMonth,
        // expensesはローカルストレージで管理するため永続化しない
      }),
    }
  )
);

// 初期化時にデータを読み込み（クライアントサイドのみ）
if (typeof window !== 'undefined') {
  try {
    const store = useExpenseStore.getState();
    store.loadExpenses();
  } catch (error) {
    console.error('ストア初期化エラー:', error);
  }
} 
