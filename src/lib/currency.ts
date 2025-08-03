// 為替レートAPIを使用した通貨換算機能

interface ExchangeRate {
  [currency: string]: number;
}

let exchangeRates: ExchangeRate = {};
let lastUpdate: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

// 為替レートを取得
export async function fetchExchangeRates(): Promise<ExchangeRate> {
  const now = Date.now();
  
  // キャッシュが有効な場合はキャッシュを使用
  if (exchangeRates && (now - lastUpdate) < CACHE_DURATION) {
    return exchangeRates;
  }

  try {
    // Exchange Rate APIを使用（無料版）
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
    const data = await response.json();
    
    if (data.rates) {
      exchangeRates = data.rates;
      lastUpdate = now;
      return exchangeRates;
    }
  } catch (error) {
    console.error('為替レート取得エラー:', error);
    
    // フォールバック: 固定レート
    exchangeRates = {
      USD: 0.0067,
      EUR: 0.0062,
      GBP: 0.0053,
      JPY: 1,
      CNY: 0.048,
      KRW: 8.9,
      SGD: 0.0091,
      HKD: 0.052,
      THB: 0.24,
      PHP: 0.38,
      IDR: 105,
      TRY: 0.21,
      AUD: 0.010,
      NOK: 0.071,
      INR: 0.56,
      HUF: 2.4,
      CHF: 0.0059,
      MXN: 0.12,
      RUB: 0.62,
      CAD: 0.0091,
      TWD: 0.21,
      KWD: 0.0021,
      ZAR: 0.13,
      NZD: 0.011,
      SAR: 0.025,
      PLN: 0.027,
      PGK: 0.024,
      MYR: 0.032,
      BHD: 0.0025,
      SEK: 0.070,
      CZK: 0.15,
      AED: 0.025,
      DKK: 0.046,
      VND: 163,
      MMK: 14,
      LBP: 0.10
    };
  }
  
  return exchangeRates;
}

// 金額をJPYに換算（小数点第一位で切り上げ）
export async function convertToJPY(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'JPY') {
    return amount;
  }
  
  const rates = await fetchExchangeRates();
  const rate = rates[fromCurrency];
  
  if (!rate) {
    console.warn(`為替レートが見つかりません: ${fromCurrency}`);
    return amount; // レートが見つからない場合はそのまま返す
  }
  
  const convertedAmount = amount / rate;
  // 小数点第一位で切り上げ
  return Math.ceil(convertedAmount);
}

// JPYを指定通貨に換算
export async function convertFromJPY(amount: number, toCurrency: string): Promise<number> {
  if (toCurrency === 'JPY') {
    return amount;
  }
  
  const rates = await fetchExchangeRates();
  const rate = rates[toCurrency];
  
  if (!rate) {
    console.warn(`為替レートが見つかりません: ${toCurrency}`);
    return amount;
  }
  
  return amount * rate;
}

// 複数の経費データの合計を計算（外貨は切り上げ処理）
export async function calculateTotalAmountWithRounding(expenses: any[]): Promise<number> {
  let totalJPY = 0;
  
  for (const expense of expenses) {
    if (expense.currency === 'JPY') {
      totalJPY += expense.totalAmount;
    } else {
      // 外貨の場合は切り上げ処理
      const convertedAmount = await convertToJPY(expense.totalAmount, expense.currency);
      totalJPY += convertedAmount;
    }
  }
  
  return totalJPY;
}

// 通貨記号を取得
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    JPY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CNY: '¥',
    KRW: '₩',
    SGD: 'S$',
    HKD: 'HK$',
    THB: '฿',
    PHP: '₱',
    IDR: 'Rp',
    TRY: '₺',
    AUD: 'A$',
    NOK: 'kr',
    INR: '₹',
    HUF: 'Ft',
    CHF: 'CHF',
    MXN: '$',
    RUB: '₽',
    CAD: 'C$',
    TWD: 'NT$',
    KWD: 'KD',
    ZAR: 'R',
    NZD: 'NZ$',
    SAR: 'SR',
    PLN: 'zł',
    PGK: 'K',
    MYR: 'RM',
    BHD: 'BD',
    SEK: 'kr',
    CZK: 'Kč',
    AED: 'د.إ',
    DKK: 'kr',
    VND: '₫',
    MMK: 'K',
    LBP: 'L£'
  };
  
  return symbols[currency] || currency;
} 
