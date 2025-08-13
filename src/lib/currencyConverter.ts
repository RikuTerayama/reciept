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
  ZAR: { code: 'ZAR', name: '南アフリカランド', symbol: 'R', isBaseCurrency: false },
  NZD: { code: 'NZD', name: 'ニュージーランドドル', symbol: 'NZ$', isBaseCurrency: false },
  SAR: { code: 'SAR', name: 'サウジアラビアリヤル', symbol: '﷼', isBaseCurrency: false },
  PLN: { code: 'PLN', name: 'ポーランドズロチ', symbol: 'zł', isBaseCurrency: false },
  PGK: { code: 'PGK', name: 'パプアニューギニアキナ', symbol: 'K', isBaseCurrency: false },
  MYR: { code: 'MYR', name: 'マレーシアリンギット', symbol: 'RM', isBaseCurrency: false },
  BHD: { code: 'BHD', name: 'バーレーンディナール', symbol: '.د.ب', isBaseCurrency: false },
  CZK: { code: 'CZK', name: 'チェココルナ', symbol: 'Kč', isBaseCurrency: false },
  DKK: { code: 'DKK', name: 'デンマーククローネ', symbol: 'kr', isBaseCurrency: false },
  VND: { code: 'VND', name: 'ベトナムドン', symbol: '₫', isBaseCurrency: false },
  MMK: { code: 'MMK', name: 'ミャンマーキャット', symbol: 'K', isBaseCurrency: false },
  LBP: { code: 'LBP', name: 'レバノンポンド', symbol: 'ل.ل', isBaseCurrency: false },
};

// デフォルトの為替レート（実際の運用ではAPIから取得）
const DEFAULT_RATES: Record<string, number> = {
  'USD_JPY': 150.0,
  'EUR_JPY': 160.0,
  'GBP_JPY': 190.0,
  'CNY_JPY': 20.0,
  'KRW_JPY': 0.11,
  'SGD_JPY': 110.0,
  'AUD_JPY': 100.0,
  'CAD_JPY': 110.0,
  'CHF_JPY': 170.0,
  'PHP_JPY': 2.7,
  'THB_JPY': 4.2,
  'HKD_JPY': 19.0,
  'IDR_JPY': 0.009,
  'TRY_JPY': 5.0,
  'NOK_JPY': 14.0,
  'INR_JPY': 1.8,
  'HUF_JPY': 0.4,
  'MXN_JPY': 8.8,
  'RUB_JPY': 1.6,
  'ZAR_JPY': 8.0,
  'NZD_JPY': 90.0,
  'SAR_JPY': 40.0,
  'PLN_JPY': 37.0,
  'PGK_JPY': 40.0,
  'MYR_JPY': 32.0,
  'BHD_JPY': 400.0,
  'CZK_JPY': 6.5,
  'DKK_JPY': 22.0,
  'VND_JPY': 0.006,
  'MMK_JPY': 0.07,
  'LBP_JPY': 0.1,
};

/**
 * 為替レートを取得（ローカルストレージから）
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number | null {
  try {
    const stored = localStorage.getItem('exchangeRates');
    if (!stored) return null;
    
    const rates: ExchangeRate[] = JSON.parse(stored);
    const rate = rates.find(r => r.from === fromCurrency && r.to === toCurrency);
    
    if (rate && Date.now() - rate.lastUpdated < 24 * 60 * 60 * 1000) {
      return rate.rate; // 24時間以内のレート
    }
    
    return null;
  } catch (error) {
    console.error('為替レートの取得に失敗しました:', error);
    return null;
  }
}

/**
 * 為替レートを保存（ローカルストレージに）
 */
export function saveExchangeRate(fromCurrency: string, toCurrency: string, rate: number): void {
  try {
    const stored = localStorage.getItem('exchangeRates');
    const rates: ExchangeRate[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = rates.findIndex(r => r.from === fromCurrency && r.to === toCurrency);
    const newRate: ExchangeRate = {
      from: fromCurrency,
      to: toCurrency,
      rate,
      lastUpdated: Date.now()
    };
    
    if (existingIndex >= 0) {
      rates[existingIndex] = newRate;
    } else {
      rates.push(newRate);
    }
    
    localStorage.setItem('exchangeRates', JSON.stringify(rates));
  } catch (error) {
    console.error('為替レートの保存に失敗しました:', error);
  }
}

/**
 * デフォルトレートから為替レートを取得
 */
function getDefaultRate(fromCurrency: string, toCurrency: string): number | null {
  if (fromCurrency === toCurrency) return 1.0;
  
  const key = `${fromCurrency}_${toCurrency}`;
  if (DEFAULT_RATES[key]) return DEFAULT_RATES[key];
  
  // 逆方向のレートがある場合は逆数を計算
  const reverseKey = `${toCurrency}_${fromCurrency}`;
  if (DEFAULT_RATES[reverseKey]) return 1 / DEFAULT_RATES[reverseKey];
  
  return null;
}

/**
 * 通貨を換算
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  baseCurrency: string = 'JPY'
): { convertedAmount: number; rate: number; source: 'stored' | 'default' | 'calculated' } {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1.0, source: 'stored' };
  }
  
  // 1. 保存されたレートを確認
  let rate = getExchangeRate(fromCurrency, toCurrency);
  let source: 'stored' | 'default' | 'calculated' = 'stored';
  
  // 2. デフォルトレートを確認
  if (!rate) {
    rate = getDefaultRate(fromCurrency, toCurrency);
    source = 'default';
  }
  
  // 3. 基軸通貨経由で計算
  if (!rate && fromCurrency !== baseCurrency && toCurrency !== baseCurrency) {
    const rateToBase = getDefaultRate(fromCurrency, baseCurrency);
    const rateFromBase = getDefaultRate(baseCurrency, toCurrency);
    
    if (rateToBase && rateFromBase) {
      rate = rateToBase * rateFromBase;
      source = 'calculated';
    }
  }
  
  if (!rate) {
    console.warn(`為替レートが見つかりません: ${fromCurrency} → ${toCurrency}`);
    return { convertedAmount: amount, rate: 1.0, source: 'calculated' };
  }
  
  const convertedAmount = amount * rate;
  
  // レートを保存（次回の使用のため）
  if (source !== 'stored') {
    saveExchangeRate(fromCurrency, toCurrency, rate);
  }
  
  return { convertedAmount, rate, source };
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
 * 基軸通貨を設定
 */
export function setBaseCurrency(currencyCode: string): void {
  try {
    // 既存の通貨情報を更新
    Object.keys(CURRENCY_INFO).forEach(code => {
      CURRENCY_INFO[code].isBaseCurrency = (code === currencyCode);
    });
    
    // ローカルストレージに保存
    localStorage.setItem('baseCurrency', currencyCode);
  } catch (error) {
    console.error('基軸通貨の設定に失敗しました:', error);
  }
}

/**
 * 基軸通貨を取得
 */
export function getBaseCurrency(): string {
  try {
    const stored = localStorage.getItem('baseCurrency');
    if (stored && CURRENCY_INFO[stored]) {
      return stored;
    }
  } catch (error) {
    console.error('基軸通貨の取得に失敗しました:', error);
  }
  
  // デフォルトは日本円
  return 'JPY';
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(amount: number, currencyCode: string, locale: string = 'ja-JP'): string {
  const symbol = getCurrencySymbol(currencyCode);
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // フォールバック: 手動フォーマット
    return `${symbol}${amount.toLocaleString(locale)}`;
  }
}

/**
 * 為替レートの更新が必要かチェック
 */
export function needsRateUpdate(fromCurrency: string, toCurrency: string): boolean {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return true;
  
  // 24時間以上古い場合は更新が必要
  return Date.now() - rate.lastUpdated > 24 * 60 * 60 * 1000;
}
