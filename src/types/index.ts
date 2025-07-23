export interface ExpenseData {
  id: string;
  date: string;
  totalAmount: number;
  taxRate: number;
  currency: string;
  category: string;
  department: string;
  isQualified: string;
  imageUrl?: string;
  ocrText?: string;
  createdAt: Date;
}

export interface OCRResult {
  date?: string;
  totalAmount?: number;
  taxRate?: number;
  isQualified?: boolean;
  text: string;
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
  'Transportation Allowance',
  'Meal Allowance',
  'Housing Allowance',
  'Office Supplies',
  'Equipment',
  'Software License',
  'Travel Expenses',
  'Training',
  'Marketing',
  'Utilities',
  'Rent',
  'Insurance',
  'Legal Fees',
  'Consulting',
  'Maintenance',
  'House Allowance'
] as const;

export const TAX_RATES = [10, 8, 0] as const;

export const DEPARTMENTS = [
  'MSD', 'DXD', 'ISD', 'SSD', 'OPD', 'FIN', 'IA', 'EO', 'HDOPD'
] as const;

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
