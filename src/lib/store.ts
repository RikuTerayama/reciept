import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExpenseData, OCRResult } from '@/types';
import { 
  loadAllExpenses, 
  addExpenseToStorage, 
  updateExpenseInStorage, 
  deleteExpenseFromStorage,
  getCurrentYearMonth,
  getYearMonthFromDate
} from '@/lib/storage';

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
      addExpense: (expense: ExpenseData) => {
        set((state) => {
          const newExpenses = [...state.expenses, expense];
          // ローカルストレージにも保存
          addExpenseToStorage(expense);
          return { expenses: newExpenses };
        });
      },

      // 経費データの更新
      updateExpense: (expense: ExpenseData) => {
        set((state) => {
          const updatedExpenses = state.expenses.map((exp) =>
            exp.id === expense.id ? expense : exp
          );
          // ローカルストレージにも更新
          updateExpenseInStorage(expense);
          return { expenses: updatedExpenses };
        });
      },

      // 経費データの削除
      deleteExpense: (id: string) => {
        set((state) => {
          const expenseToDelete = state.expenses.find(exp => exp.id === id);
          const filteredExpenses = state.expenses.filter((exp) => exp.id !== id);
          const filteredSelection = state.selectedExpenses.filter((selectedId) => selectedId !== id);
          
          // ローカルストレージからも削除
          if (expenseToDelete) {
            deleteExpenseFromStorage(id, expenseToDelete.date);
          }
          
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
        const { loadMonthlyExpenses } = require('@/lib/storage');
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

// 初期化時にデータを読み込み
if (typeof window !== 'undefined') {
  const store = useExpenseStore.getState();
  store.loadExpenses();
} 
