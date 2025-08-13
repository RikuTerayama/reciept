/**
 * 通貨換算ユーティリティ
 */

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
}

// 主要通貨の基本情報
export const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  JPY: { code: 'JPY', name: '日本円', symbol: '¥', isBaseCurrency: false },
  USD: { code: 'USD', name: '米ドル', symbol: '$', isBaseCurrency: false },
  EUR: { code: 'EUR', name: 'ユーロ', symbol: '€', isBaseCurrency: false },
  GBP: { code: 'GBP', name: 'ポンド', symbol: '£', isBaseCurrency: false },
  CNY: { code: 'CNY', name: '人民元', symbol: '¥', isBaseCurrency: false },
  KRW: { code: 'KRW', name: '韓国ウォン', symbol: '₩', isBaseCurrency: false },
  SGD: { code: 'SGD', name: 'シンガポールドル', symbol: 'S$', isBaseCurrency: false },
  AUD: { code: 'AUD', name: '豪ドル', symbol: 'A$', isBaseCurrency: false },
  CAD: { code: 'CAD', name: 'カナダドル', symbol: 'C$', isBaseCurrency: false },
  CHF: { code: 'CHF', name: 'スイスフラン', symbol: 'CHF', isBaseCurrency: false },
  PHP: { code: 'PHP', name: 'フィリピンペソ', symbol: '₱', isBaseCurrency: false },
  THB: { code: 'THB', name: 'タイバーツ', symbol: '฿', isBaseCurrency: false },
  HKD: { code: 'HKD', name: '香港ドル', symbol: 'HK$', isBaseCurrency: false },
  IDR: { code: 'IDR', name: 'インドネシアルピア', symbol: 'Rp', isBaseCurrency: false },
  TRY: { code: 'TRY', name: 'トルコリラ', symbol: '₺', isBaseCurrency: false },
  NOK: { code: 'NOK', name: 'ノルウェークローネ', symbol: 'kr', isBaseCurrency: false },
  INR: { code: 'INR', name: 'インドルピー', symbol: '₹', isBaseCurrency: false },
  HUF: { code: 'HUF', name: 'ハンガリーフォリント', symbol: 'Ft', isBaseCurrency: false },
  MXN: { code: 'MXN', name: 'メキシコペソ', symbol: '$', isBaseCurrency: false },
  RUB: { code: 'RUB', name: 'ロシアルーブル', symbol: '₽', isBaseCurrency: false },
  TWD: { code: 'TWD', name: '台湾ドル', symbol: 'NT$', isBaseCurrency: false },
  KWD: { code: 'KWD', name: 'クウェートディナール', symbol: 'د.ك', isBaseCurrency: false },
  ZAR: { code: 'ZAR', name: '南アフリカランド', symbol: 'R', isBaseCurrency: false },
  NZD: { code: 'NZD', name: 'ニュージーランドドル', symbol: 'NZ$', isBaseCurrency: false },
  SAR: { code: 'SAR', name: 'サウジアラビアリヤル', symbol: 'ر.س', isBaseCurrency: false },
  PLN: { code: 'PLN', name: 'ポーランドズロティ', symbol: 'zł', isBaseCurrency: false },
  PGK: { code: 'PGK', name: 'パプアニューギニアキナ', symbol: 'K', isBaseCurrency: false },
  MYR: { code: 'MYR', name: 'マレーシアリンギット', symbol: 'RM', isBaseCurrency: false },
  BHD: { code: 'BHD', name: 'バーレーンディナール', symbol: '.د.ب', isBaseCurrency: false },
  SEK: { code: 'SEK', name: 'スウェーデンクローナ', symbol: 'kr', isBaseCurrency: false },
  CZK: { code: 'CZK', name: 'チェココルナ', symbol: 'Kč', isBaseCurrency: false },
  AED: { code: 'AED', name: 'UAEディルハム', symbol: 'د.إ', isBaseCurrency: false },
  DKK: { code: 'DKK', name: 'デンマーククローネ', symbol: 'kr', isBaseCurrency: false },
  VND: { code: 'VND', name: 'ベトナムドン', symbol: '₫', isBaseCurrency: false },
  MMK: { code: 'MMK', name: 'ミャンマーキャット', symbol: 'K', isBaseCurrency: false },
  LBP: { code: 'LBP', name: 'レバノンポンド', symbol: 'ل.ل', isBaseCurrency: false },
};

// オフィス別の基軸通貨設定
export const OFFICE_BASE_CURRENCIES: Record<string, string> = {
  'japan': 'JPY',
  'singapore': 'SGD',
  'australia': 'AUD',
  'hongkong': 'HKD',
  'thailand': 'THB',
  'philippines': 'PHP',
  'indonesia': 'IDR',
  'malaysia': 'MYR',
  'vietnam': 'VND',
  'myanmar': 'MMK',
  'default': 'JPY', // デフォルトは日本円
};

// サンプル為替レート（実際の運用では外部APIから取得）
const SAMPLE_EXCHANGE_RATES: Record<string, number> = {
  'USD_JPY': 150.0,
  'EUR_JPY': 165.0,
  'GBP_JPY': 190.0,
  'CNY_JPY': 20.5,
  'KRW_JPY': 0.11,
  'SGD_JPY': 112.0,
  'AUD_JPY': 98.0,
  'CAD_JPY': 110.0,
  'CHF_JPY': 170.0,
  'PHP_JPY': 2.7,
  'THB_JPY': 4.2,
  'HKD_JPY': 19.2,
  'IDR_JPY': 0.0096,
  'TRY_JPY': 4.8,
  'NOK_JPY': 14.2,
  'INR_JPY': 1.8,
  'HUF_JPY': 0.42,
  'MXN_JPY': 8.9,
  'RUB_JPY': 1.6,
  'TWD_JPY': 4.7,
  'KWD_JPY': 490.0,
  'ZAR_JPY': 8.1,
  'NZD_JPY': 92.0,
  'SAR_JPY': 40.0,
  'PLN_JPY': 37.0,
  'PGK_JPY': 42.0,
  'BHD_JPY': 400.0,
  'SEK_JPY': 14.5,
  'CZK_JPY': 6.8,
  'AED_JPY': 40.8,
  'DKK_JPY': 22.0,
  'VND_JPY': 0.0061,
  'MMK_JPY': 0.071,
  'LBP_JPY': 0.0005,
};

/**
 * オフィス名から基軸通貨を取得
 */
export function getBaseCurrencyForOffice(officeName: string): string {
  const normalizedOffice = officeName.toLowerCase().replace(/\s+/g, '');
  return OFFICE_BASE_CURRENCIES[normalizedOffice] || OFFICE_BASE_CURRENCIES.default;
}

/**
 * 為替レートを取得（サンプルデータから）
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1.0;
  
  // 直接レートがある場合
  const directKey = `${fromCurrency}_${toCurrency}`;
  if (SAMPLE_EXCHANGE_RATES[directKey]) {
    return SAMPLE_EXCHANGE_RATES[directKey];
  }
  
  // 逆レートがある場合
  const reverseKey = `${toCurrency}_${fromCurrency}`;
  if (SAMPLE_EXCHANGE_RATES[reverseKey]) {
    return 1 / SAMPLE_EXCHANGE_RATES[reverseKey];
  }
  
  // JPY経由での計算（JPYが基準通貨の場合）
  if (fromCurrency === 'JPY' && SAMPLE_EXCHANGE_RATES[`${toCurrency}_JPY`]) {
    return 1 / SAMPLE_EXCHANGE_RATES[`${toCurrency}_JPY`];
  }
  
  if (toCurrency === 'JPY' && SAMPLE_EXCHANGE_RATES[`${fromCurrency}_JPY`]) {
    return SAMPLE_EXCHANGE_RATES[`${fromCurrency}_JPY`];
  }
  
  // デフォルトレート（1.0）
  console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using 1.0`);
  return 1.0;
}

/**
 * 通貨を基軸通貨に換算
 */
export function convertToBaseCurrency(
  amount: number,
  fromCurrency: string,
  baseCurrency: string
): number {
  if (fromCurrency === baseCurrency) return amount;
  
  const rate = getExchangeRate(fromCurrency, baseCurrency);
  return amount * rate;
}

/**
 * 基軸通貨から指定通貨に換算
 */
export function convertFromBaseCurrency(
  amount: number,
  baseCurrency: string,
  toCurrency: string
): number {
  if (baseCurrency === toCurrency) return amount;
  
  const rate = getExchangeRate(baseCurrency, toCurrency);
  return amount * rate;
}

/**
 * 通貨間の直接換算
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * 為替レートの有効性をチェック
 */
export function isExchangeRateValid(fromCurrency: string, toCurrency: string): boolean {
  if (fromCurrency === toCurrency) return true;
  
  const directKey = `${fromCurrency}_${toCurrency}`;
  const reverseKey = `${toCurrency}_${fromCurrency}`;
  
  return !!(SAMPLE_EXCHANGE_RATES[directKey] || SAMPLE_EXCHANGE_RATES[reverseKey]);
}

/**
 * 通貨情報を取得
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
  return CURRENCY_INFO[currencyCode] || null;
}

/**
 * 通貨記号を取得
 */
export function getCurrencySymbol(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  return info?.symbol || currencyCode;
}

/**
 * 通貨名を取得
 */
export function getCurrencyName(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  return info?.name || currencyCode;
}

/**
 * 金額を指定通貨でフォーマット
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = 'ja-JP'
): string {
  const symbol = getCurrencySymbol(currencyCode);
  
  try {
    // 通貨別のフォーマット設定
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(amount);
  } catch (error) {
    // フォーマット失敗時のフォールバック
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * 基軸通貨での表示用フォーマット
 */
export function formatBaseCurrency(
  amount: number,
  baseCurrency: string,
  locale: string = 'ja-JP'
): string {
  return formatCurrency(amount, baseCurrency, locale);
}

/**
 * 外貨と基軸通貨の両方を表示
 */
export function formatDualCurrency(
  originalAmount: number,
  originalCurrency: string,
  convertedAmount: number,
  baseCurrency: string,
  locale: string = 'ja-JP'
): string {
  const original = formatCurrency(originalAmount, originalCurrency, locale);
  const converted = formatCurrency(convertedAmount, baseCurrency, locale);
  
  if (originalCurrency === baseCurrency) {
    return converted;
  }
  
  return `${original} (${converted})`;
}

/**
 * 為替レートの表示
 */
export function formatExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): string {
  if (fromCurrency === toCurrency) return '1.00';
  
  return `${rate.toFixed(4)} ${fromCurrency}/${toCurrency}`;
}

/**
 * 為替レートの更新日時を取得
 */
export function getExchangeRateLastUpdated(): Date {
  // サンプルデータなので現在時刻を返す
  // 実際の運用では外部APIから取得した更新日時を返す
  return new Date();
}

/**
 * 為替レートの有効期限をチェック
 */
export function isExchangeRateExpired(lastUpdated: number, maxAgeHours: number = 24): boolean {
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return (now - lastUpdated) > maxAgeMs;
}
