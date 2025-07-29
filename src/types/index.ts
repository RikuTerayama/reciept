export interface UserInfo {
  email: string;
  targetMonth: string;
  budget: number;
}

export interface ExpenseData {
  id: string;
  date: string;
  amount: number;
  totalAmount: number;
  currency: string;
  category: string;
  description: string;
  taxRate: number;
  participantFromClient?: string;
  participantFromCompany?: string;
  isQualified: string;
  receiptImage?: string;
  imageData?: string;
  receiptNumber?: string;
  ocrText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  date: string;
  amount: string;
  category: string;
  description: string;
  receiptImage?: File;
}

export interface SearchFilters {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  description?: string;
}

export interface BudgetOptimizationResult {
  selectedExpenses: ExpenseData[];
  totalAmount: number;
  remainingBudget: number;
  optimizationScore: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  amount?: number;
  date?: string;
  merchant?: string;
}

export interface BatchUploadResult {
  success: number;
  failed: number;
  total: number;
  results: {
    filename: string;
    success: boolean;
    error?: string;
    data?: ExpenseData;
  }[];
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  includeReceipts: boolean;
  groupByCategory: boolean;
}

export interface AppSettings {
  language: 'ja' | 'en';
  currency: string;
  taxRate: number;
  defaultCategory: string;
  autoSave: boolean;
  notifications: boolean;
}

export interface Statistics {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: {
    category: string;
    count: number;
    amount: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
}

// 通貨
export const CURRENCIES = [
  { code: 'JPY', symbol: '¥', name: '日本円' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' }
];

// 経費カテゴリ
export const EXPENSE_CATEGORIES = [
  '交通費',
  '通信費',
  '会議費',
  '接待費',
  '研修費',
  '消耗品費',
  '印刷費',
  '広告費',
  '保険料',
  'その他'
];

// 税率
export const TAX_RATES = [
  { rate: 0, label: '0%' },
  { rate: 0.05, label: '5%' },
  { rate: 0.08, label: '8%' },
  { rate: 0.1, label: '10%' }
];

// 資格・認定
export const QUALIFICATION_TYPES = [
  '税理士',
  '公認会計士',
  '社会保険労務士',
  '行政書士',
  '司法書士',
  '弁護士',
  'その他'
];

// 言語設定
export const LANGUAGES = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' }
];

// デフォルト設定
export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ja',
  currency: 'JPY',
  taxRate: 0.1,
  defaultCategory: 'その他',
  autoSave: true,
  notifications: true
};

// 検証ルール
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  amount: {
    required: true,
    min: 1,
    max: 999999999
  },
  date: {
    required: true
  },
  category: {
    required: true
  }
};

// エラーメッセージ
export const ERROR_MESSAGES = {
  required: 'この項目は必須です',
  invalidEmail: '有効なメールアドレスを入力してください',
  invalidAmount: '有効な金額を入力してください',
  invalidDate: '有効な日付を入力してください',
  fileTooLarge: 'ファイルサイズが大きすぎます',
  unsupportedFileType: 'サポートされていないファイル形式です',
  networkError: 'ネットワークエラーが発生しました',
  serverError: 'サーバーエラーが発生しました',
  unknownError: '予期しないエラーが発生しました'
};

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  saved: '保存しました',
  uploaded: 'アップロードしました',
  exported: 'エクスポートしました',
  deleted: '削除しました',
  reset: 'リセットしました'
}; 
