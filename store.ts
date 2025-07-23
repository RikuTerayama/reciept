import { create } from 'zustand';
import { ExpenseData, OCRResult, OptimizedExpense } from '@/types';

interface ExpenseStore {
  expenses: ExpenseData[];
  selectedExpenses: string[];
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  optimizedExpense: OptimizedExpense | null;
  
  // Actions
  addExpense: (expense: ExpenseData) => void;
  updateExpense: (id: string, updates: Partial<ExpenseData>) => void;
  deleteExpense: (id: string) => void;
  setOCRResult: (result: OCRResult | null) => void;
  setProcessing: (processing: boolean) => void;
  toggleExpenseSelection: (id: string) => void;
  clearSelection: () => void;
  setOptimizedExpense: (optimized: OptimizedExpense | null) => void;
  clearAll: () => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  selectedExpenses: [],
  ocrResult: null,
  isProcessing: false,
  optimizedExpense: null,

  addExpense: (expense) => {
    set((state) => ({
      expenses: [...state.expenses, expense],
    }));
  },

  updateExpense: (id, updates) => {
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...updates } : expense
      ),
    }));
  },

  deleteExpense: (id) => {
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id),
      selectedExpenses: state.selectedExpenses.filter((expenseId) => expenseId !== id),
    }));
  },

  setOCRResult: (result) => {
    set({ ocrResult: result });
  },

  setProcessing: (processing) => {
    set({ isProcessing: processing });
  },

  toggleExpenseSelection: (id) => {
    set((state) => ({
      selectedExpenses: state.selectedExpenses.includes(id)
        ? state.selectedExpenses.filter((expenseId) => expenseId !== id)
        : [...state.selectedExpenses, id],
    }));
  },

  clearSelection: () => {
    set({ selectedExpenses: [] });
  },

  setOptimizedExpense: (optimized) => {
    set({ optimizedExpense: optimized });
  },

  clearAll: () => {
    set({
      expenses: [],
      selectedExpenses: [],
      ocrResult: null,
      isProcessing: false,
      optimizedExpense: null,
    });
  },
})); 