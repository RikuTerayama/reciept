/**
 * 為替レート関連の機能
 */

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

// 固定レート（APIが利用できない場合のフォールバック）
const FIXED_RATES: Record<string, number> = {
  USD: 150.0,
  EUR: 165.0,
  GBP: 190.0,
  CNY: 21.0,
  KRW: 0.11,
  SGD: 112.0,
  AUD: 100.0,
  CAD: 110.0,
  CHF: 175.0,
  THB: 4.2,
  HKD: 19.2,
  IDR: 0.0096,
  TRY: 5.1,
  NOK: 14.5,
  INR: 1.8,
  HUF: 0.42,
  MXN: 8.8,
  RUB: 1.6,
  TWD: 4.8,
  KWD: 490.0,
  ZAR: 8.1,
  NZD: 92.0,
  SAR: 40.0,
  PLN: 37.0,
  PGK: 42.0,
  MYR: 32.0,
  BHD: 400.0,
  SEK: 14.5,
  CZK: 6.5,
  AED: 41.0,
  DKK: 22.0,
  VND: 0.0062,
  MMK: 0.071,
  LBP: 0.0001,
};

/**
 * 為替レートを取得
 */
export async function fetchExchangeRates(baseCurrency: string = 'JPY'): Promise<ExchangeRate> {
  try {
    // 実際のAPIを使用（無料版の制限があるため注意）
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error('為替レートAPIの取得に失敗しました');
    }
    
    const data = await response.json();
    return {
      base: data.base,
      rates: data.rates,
      date: data.date
    };
  } catch (error) {
    console.warn('為替レートAPIの取得に失敗、固定レートを使用します:', error);
    
    // 固定レートを使用
    return {
      base: baseCurrency,
      rates: FIXED_RATES,
      date: new Date().toISOString().split('T')[0]
    };
  }
}

/**
 * 通貨を日本円に換算
 */
export function convertToJPY(amount: number, fromCurrency: string, rates: Record<string, number>): number {
  if (fromCurrency === 'JPY') {
    return amount;
  }
  
  const rate = rates[fromCurrency];
  if (!rate) {
    console.warn(`為替レートが見つかりません: ${fromCurrency}`);
    return amount; // レートが見つからない場合は元の金額を返す
  }
  
  return amount * rate;
}

/**
 * 日本円から他の通貨に換算
 */
export function convertFromJPY(amount: number, toCurrency: string, rates: Record<string, number>): number {
  if (toCurrency === 'JPY') {
    return amount;
  }
  
  const rate = rates[toCurrency];
  if (!rate) {
    console.warn(`為替レートが見つかりません: ${toCurrency}`);
    return amount; // レートが見つからない場合は元の金額を返す
  }
  
  return amount / rate;
}

/**
 * 通貨換算を実行
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): CurrencyConversion {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      baseCurrency: toCurrency,
      conversionRate: 1,
      conversionDate: new Date().toISOString()
    };
  }
  
  // 一旦JPYに換算してから目標通貨に換算
  const jpyAmount = convertToJPY(amount, fromCurrency, rates);
  const convertedAmount = convertFromJPY(jpyAmount, toCurrency, rates);
  
  const conversionRate = jpyAmount / amount;
  
  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // 小数点以下2桁に丸める
    baseCurrency: toCurrency,
    conversionRate: Math.round(conversionRate * 10000) / 10000, // 小数点以下4桁に丸める
    conversionDate: new Date().toISOString()
  };
}

/**
 * 通貨記号を取得
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    JPY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CNY: '¥',
    KRW: '₩',
    SGD: 'S$',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    THB: '฿',
    HKD: 'HK$',
    IDR: 'Rp',
    TRY: '₺',
    NOK: 'kr',
    INR: '₹',
    HUF: 'Ft',
    MXN: '$',
    RUB: '₽',
    TWD: 'NT$',
    KWD: 'KD',
    ZAR: 'R',
    NZD: 'NZ$',
    SAR: 'SAR',
    PLN: 'zł',
    PGK: 'K',
    MYR: 'RM',
    BHD: 'BD',
    SEK: 'kr',
    CZK: 'Kč',
    AED: 'AED',
    DKK: 'kr',
    VND: '₫',
    MMK: 'K',
    LBP: 'L£',
  };
  
  return symbols[currency] || currency;
}

/**
 * 通貨名を取得
 */
export function getCurrencyName(currency: string): string {
  const names: Record<string, string> = {
    JPY: '日本円',
    USD: '米ドル',
    EUR: 'ユーロ',
    GBP: 'ポンド',
    CNY: '人民元',
    KRW: '韓国ウォン',
    SGD: 'シンガポールドル',
    AUD: '豪ドル',
    CAD: 'カナダドル',
    CHF: 'スイスフラン',
    THB: 'タイバーツ',
    HKD: '香港ドル',
    IDR: 'インドネシアルピア',
    TRY: 'トルコリラ',
    NOK: 'ノルウェークローネ',
    INR: 'インドルピー',
    HUF: 'ハンガリーフォリント',
    MXN: 'メキシコペソ',
    RUB: 'ロシアルーブル',
    TWD: '台湾ドル',
    KWD: 'クウェートディナール',
    ZAR: '南アフリカランド',
    NZD: 'ニュージーランドドル',
    SAR: 'サウジアラビアリヤル',
    PLN: 'ポーランドズロチ',
    PGK: 'パプアニューギニアキナ',
    MYR: 'マレーシアリンギット',
    BHD: 'バーレーンディナール',
    SEK: 'スウェーデンクローナ',
    CZK: 'チェココルナ',
    AED: 'UAEディルハム',
    DKK: 'デンマーククローネ',
    VND: 'ベトナムドン',
    MMK: 'ミャンマーキャット',
    LBP: 'レバノンポンド',
  };
  
  return names[currency] || currency;
} 
