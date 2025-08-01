// アプリケーションバージョン
export const APP_VERSION = '7.0.0';

// デフォルト設定
export const DEFAULT_SETTINGS = {
  budget: 100000,
  targetMonth: new Date().toISOString().split('T')[0].substring(0, 7),
  email: '',
};

// サポートされている通貨
export const SUPPORTED_CURRENCIES = [
  'JPY', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'KRW', 'SGD',
  'HKD', 'THB', 'PHP', 'IDR', 'MYR', 'VND', 'INR', 'BRL', 'MXN', 'ZAR'
];

// 税率オプション
export const TAX_RATES = [0, 8, 10];

// カテゴリオプション
export const EXPENSE_CATEGORIES = [
  '交通費',
  '食費',
  '宿泊費',
  '会議費',
  '通信費',
  'その他'
];

// 適格区分オプション
export const QUALIFICATION_STATUS = [
  'Qualified',
  'Non-Qualified'
];

// ファイルサイズ制限
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// サポートされている画像形式
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// サポートされているPDF形式
export const SUPPORTED_PDF_FORMATS = [
  'application/pdf'
];

// OCR設定
export const OCR_SETTINGS = {
  maxRetries: 3,
  timeout: 30000, // 30秒
  confidenceThreshold: 0.7
};

// ストレージキー
export const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  EXPENSES: 'expenses',
  SETTINGS: 'settings',
  LANGUAGE: 'language'
};

// API設定
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3
};

// アニメーション設定
export const ANIMATION_CONFIG = {
  duration: 200,
  easing: 'ease-out'
};

// レスポンシブブレークポイント
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// ページネーション設定
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100
};

// 検索設定
export const SEARCH_CONFIG = {
  debounceDelay: 300,
  minSearchLength: 2
};

// エクスポート設定
export const EXPORT_CONFIG = {
  maxItemsPerExport: 1000,
  defaultFilename: 'expenses',
  supportedFormats: ['xlsx', 'csv']
}; 
