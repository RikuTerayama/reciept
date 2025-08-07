export interface ExpenseData {
  id: string;
  date: string;
  receiptDate: string;
  totalAmount: number;
  category: string;
  description: string;
  taxRate: number;
  participantFromClient: number;
  participantFromCompany: number;
  isQualified: string;
  currency: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  baseCurrency: string;
  conversionRate: number;
  conversionDate: string;
  createdAt: Date;
  updatedAt?: Date;
  imageData?: string;
  imageUrl?: string; // Firebase Storage URL
  imageFileName?: string; // 保存されたファイル名
  ocrText?: string;
  receiptNumber?: string;
  companyName?: string;
  rechargedToClient?: string; // N/Y
  gstVatApplicable?: string; // N/Y
  userEmail?: string; // ユーザーメールアドレス
}

// 同期用の型定義
export interface SyncableExpenseData extends ExpenseData {
  synced?: boolean;
  lastSyncAt?: Date;
}

export interface OCRResult {
  date?: string;
  totalAmount?: number;
  taxRate?: number;
  isQualified?: boolean;
  category?: string;
  description?: string;
  text: string;
  confidence?: number; // OCR信頼度
  imageData?: string; // Base64画像データ
  receiptNumber?: string; // レシート番号
  companyName?: string; // 会社名
}

export interface BudgetOption {
  id: string;
  amount: number;
  label: string;
}

export interface OptimizedExpense {
  expenses: ExpenseData[];
  totalAmount: number;
  difference: number;
}

export const CURRENCIES = [
  'PHP', 'THB', 'HKD', 'IDR', 'TRY', 'CNY', 'AUD', 'NOK', 'INR', 'HUF',
  'CHF', 'MXN', 'RUB', 'CAD', 'KRW', 'TWD', 'KWD', 'EUR', 'ZAR', 'NZD',
  'SAR', 'PLN', 'PGK', 'MYR', 'BHD', 'SGD', 'SEK', 'JPY', 'GBP', 'CZK',
  'AED', 'DKK', 'USD', 'VND', 'MMK', 'LBP'
] as const;

export const EXPENSE_CATEGORIES = [
  'Salaries Expense - Temporary/Part-Time',
  'Interviewee Fee',
  'Telephone Allowance',
  'Staff Welfare Expenses',
  'Staff Training',
  'Recruitment Expenses',
  'Employment Residency/Visa',
  'Travel & Expenses - Per Diem',
  'Travel & Expenses - Meal',
  'Travel & Expenses - Transportation',
  'Travel & Expenses - Others',
  'Travel & Expenses - Accommodation',
  'Entertainment & Gifts',
  'Meetings & Conferences',
  'Marketing & Advertising',
  'Market Research',
  'Rental - Others',
  'Office Cleaning',
  'Repair & Maintenance',
  'Insurance Expense - Corporate',
  'Subscriptions',
  'Administrative Courier',
  'Printing & Stationery',
  'Office Supplies',
  'Sundry Administrative Expenses',
  'Business Registration & License Renewal',
  'Fines & Penalties - Other',
  'Bank Charges',
  'Others',
  'House Allowance'
] as const;

export const TAX_RATES = [10, 8, 0] as const;

export const QUALIFICATION_TYPES = [
  'Qualified invoice/receipt',
  'Qualified(by public transportation exception)',
  'Qualified(by business trip/allowance exception)',
  'Not Qualified'
] as const;

export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: '100000', amount: 100000, label: '10万円' },
  { id: '150000', amount: 150000, label: '15万円' },
  { id: '200000', amount: 200000, label: '20万円' }
];

// 認証関連の型定義
export interface UserInfo {
  uid?: string;
  email: string;
  targetMonth: string;
  budget: number;
  currency?: string;
  office?: string;
}

export interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
}

// 為替レート関連の型定義
export interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  baseCurrency: string;
  conversionRate: number;
  conversionDate: string;
} 
