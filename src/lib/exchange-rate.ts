import { ExchangeRate, CurrencyConversion } from '@/types';

// ExchangeRate.host APIを使用した為替レート取得
export const fetchExchangeRates = async (baseCurrency: string = 'JPY'): Promise<ExchangeRate> => {
  try {
    const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    return {
      base: data.base,
      rates: data.rates,
      date: data.date
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error('為替レートの取得に失敗しました');
  }
};

// 通貨換算
export const convertCurrency = (
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
      convertedAmount: Math.round(convertedAmount * 100) / 100, // 小数点2桁に丸める
      baseCurrency: toCurrency,
      conversionRate: rate,
      conversionDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error('通貨換算に失敗しました');
  }
};

// 複数通貨の一括換算
export const convertMultipleCurrencies = async (
  expenses: Array<{ amount: number; currency: string }>,
  baseCurrency: string = 'JPY'
): Promise<CurrencyConversion[]> => {
  try {
    const rates = await fetchExchangeRates(baseCurrency);
    
    return expenses.map(expense => 
      convertCurrency(expense.amount, expense.currency, baseCurrency, rates.rates)
    );
  } catch (error) {
    console.error('Multiple currency conversion error:', error);
    throw new Error('複数通貨の換算に失敗しました');
  }
};

// 通貨記号の取得
export const getCurrencySymbol = (currency: string): string => {
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
    CHF: 'CHF'
  };
  
  return symbols[currency] || currency;
};

// 通貨名の取得
export const getCurrencyName = (currency: string): string => {
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
    CHF: 'スイスフラン'
  };
  
  return names[currency] || currency;
}; 
