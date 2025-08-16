export interface ExpenseData {
  id: string;
  date: string;                    // 必須 (YYYY-MM-DD)
  totalAmount: number;             // 必須（数値）
  monthKey?: string;               // 自動付与 (YYYY-MM)
  receiptDate?: string;            // 任意
  category?: string;               // 任意
  description?: string;            // 任意
  taxRate?: number;                // 任意
  participantFromClient?: number;  // 任意
  participantFromCompany?: number; // 任意
  isQualified?: string;            // 任意
  currency?: string;               // 任意
  originalAmount?: number;         // 任意
  originalCurrency?: string;       // 任意
  convertedAmount?: number;        // 任意
  baseCurrency?: string;           // 任意
  conversionRate?: number;         // 任意
  conversionDate?: string;         // 任意
  // 通貨換算関連
  isForeignCurrency?: boolean;     // 外貨かどうか
  exchangeRate?: number;           // 為替レート
  baseCurrencyAmount?: number;     // 基軸通貨での金額
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
  source?: 'ocr' | 'voice'; // データソース
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
  createdAt?: Date;
  updatedAt?: Date;
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

// 共通の型定義
export interface ErrorWithMessage {
  message: string;
  code?: string;
  details?: unknown;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
  code?: string;
}

export interface VoiceInputResult {
  date?: string;
  amount?: number;
  transcript: string;
  confidence: number;
}

export interface OCRProgressCallback {
  (progress: number, stage: string): void;
}

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface FirebaseFirestore {
  collection: (path: string) => any;
  doc: (path: string) => any;
  addDoc: (collectionRef: any, data: any) => Promise<any>;
  updateDoc: (docRef: any, data: any) => Promise<void>;
  deleteDoc: (docRef: any) => Promise<void>;
  getDocs: (query: any) => Promise<any>;
  getDoc: (docRef: any) => Promise<any>;
  query: (collectionRef: any, ...constraints: any[]) => any;
  where: (field: string, op: string, value: any) => any;
  orderBy: (field: string, direction?: 'asc' | 'desc') => any;
  limit: (limit: number) => any;
}

export interface FirebaseAuth {
  currentUser: FirebaseAuthUser | null;
  onAuthStateChanged: (callback: (user: FirebaseAuthUser | null) => void) => () => void;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

export interface TesseractWorker {
  loadLanguage: (lang: string) => Promise<void>;
  initialize: (lang: string) => Promise<void>;
  setParameters: (params: Record<string, any>) => Promise<void>;
  recognize: (image: ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | CanvasRenderingContext2D | File | Blob | ImageBitmap | ImageData, options?: Record<string, any>) => Promise<any>;
  terminate: () => Promise<void>;
}

export interface TesseractProgress {
  status: string;
  progress: number;
}

export interface TesseractRecognizeResult {
  data: {
    text: string;
    confidence: number;
    words?: Array<{
      text: string;
      confidence: number;
      bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
    }>;
  };
  jobId: string;
}

export interface BatchUploadResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface BatchUploadValue {
  value: string | number;
  isValid: boolean;
  error?: string;
}

export interface FormInputEvent {
  target: {
    name: string;
    value: string | number;
  };
}

export interface VoiceInputCompleteEvent {
  date?: string;
  amount?: number;
  transcript: string;
}

export interface OCRCompleteEvent {
  date?: string;
  amount?: number;
  text: string;
  confidence?: number;
  imageData?: string;
}

export interface ExpenseFormError {
  field: string;
  message: string;
}

export interface MobileStatisticsProps {
  expenses: ExpenseData[];
}

export interface BudgetOptimizationResult {
  selectedExpenses: ExpenseData[];
  totalAmount: number;
  difference: number;
  optimizationScore: number;
}

export interface DebounceFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}
