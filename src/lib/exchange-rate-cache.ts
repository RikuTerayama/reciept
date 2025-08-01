import useSWR from 'swr';
import { ExchangeRate, CurrencyConversion } from '@/types';

// キャッシュキー
const EXCHANGE_RATE_CACHE_KEY = 'exchange-rates';

// ローカルストレージキャッシュ
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

interface CachedExchangeRate {
  data: ExchangeRate;
  timestamp: number;
}

// ローカルストレージからキャッシュを取得
const getCachedRates = (): ExchangeRate | null => {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedExchangeRate = JSON.parse(cached);
    const now = Date.now();
    
    // キャッシュが有効期限内かチェック
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data;
    }
    
    // 期限切れのキャッシュを削除
    localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cached exchange rates:', error);
    return null;
  }
};

// ローカルストレージにキャッシュを保存
const setCachedRates = (rates: ExchangeRate): void => {
  try {
    const cached: CachedExchangeRate = {
      data: rates,
      timestamp: Date.now()
    };
    localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching exchange rates:', error);
  }
};

// 為替レート取得関数（SWR用）
const fetchRatesWithCache = async (baseCurrency: string = 'JPY'): Promise<ExchangeRate> => {
  // まずキャッシュをチェック
  const cached = getCachedRates();
  if (cached && cached.base === baseCurrency) {
    return cached;
  }
  
  // キャッシュがない場合はAPIから取得
  try {
    const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const rates: ExchangeRate = {
      base: data.base,
      rates: data.rates,
      date: data.date
    };
    
    // キャッシュに保存
    setCachedRates(rates);
    
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // APIエラー時は固定レートを返す
    return {
      base: baseCurrency,
      rates: {
        JPY: baseCurrency === 'JPY' ? 1 : 140,
        USD: baseCurrency === 'USD' ? 1 : 0.007,
        EUR: baseCurrency === 'EUR' ? 1 : 0.006,
        GBP: baseCurrency === 'GBP' ? 1 : 0.005,
        CNY: baseCurrency === 'CNY' ? 1 : 0.05,
        KRW: baseCurrency === 'KRW' ? 1 : 1.2,
        SGD: baseCurrency === 'SGD' ? 1 : 0.009,
        AUD: baseCurrency === 'AUD' ? 1 : 0.011,
        CAD: baseCurrency === 'CAD' ? 1 : 0.009,
        CHF: baseCurrency === 'CHF' ? 1 : 0.008
      },
      date: new Date().toISOString()
    };
  }
};

// SWRフック
export const useExchangeRates = (baseCurrency: string = 'JPY') => {
  const { data, error, mutate } = useSWR(
    `exchange-rates-${baseCurrency}`,
    () => fetchRatesWithCache(baseCurrency),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24時間
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return {
    rates: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
};

// 通貨換算（キャッシュ対応）
export const convertCurrencyWithCache = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): CurrencyConversion => {
  try {
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
    
    const rate = rates[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    const convertedAmount = amount * rate;
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      baseCurrency: toCurrency,
      conversionRate: rate,
      conversionDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error('通貨換算に失敗しました');
  }
};

// キャッシュクリア
export const clearExchangeRateCache = (): void => {
  try {
    localStorage.removeItem(EXCHANGE_RATE_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing exchange rate cache:', error);
  }
}; 
