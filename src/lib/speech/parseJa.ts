// 漢数字の変換マップ
const KANJI_NUMBERS: { [key: string]: number } = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '百': 100, '千': 1000, '万': 10000, '億': 100000000
};

// 全角文字の変換マップ
const FULLWIDTH_TO_HALFWIDTH: { [key: string]: string } = {
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
  '．': '.', '，': ',', '：': ':', '－': '-', '／': '/'
};

// 日付パターン
const DATE_PATTERNS = [
  // YYYY年MM月DD日
  /(\d{4})年(\d{1,2})月(\d{1,2})日/,
  // MM月DD日
  /(\d{1,2})月(\d{1,2})日/,
  // YYYY/MM/DD, YYYY-MM-DD
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  // MM/DD, MM-DD
  /(\d{1,2})[\/\-](\d{1,2})/,
  // 漢数字の日付
  /([一二三四五六七八九十]+)月([一二三四五六七八九十]+)日/
];

// 金額パターン
const AMOUNT_PATTERNS = [
  // 数字 + 円
  /(\d+(?:,\d{3})*)円/,
  // 漢数字 + 円
  /([一二三四五六七八九十百千万億]+)円/,
  // 数字のみ（3桁以上）
  /\b(\d{3,12})\b/,
  // カンマ区切りの数字
  /(\d{1,3}(?:,\d{3})+)/
];

// 音声認識結果の型定義
export interface ParsedSpeechResult {
  transcript: string;
  date?: string;
  amount?: number;
  confidence: number;
  parsingDetails: {
    dateFound: boolean;
    amountFound: boolean;
    dateConfidence: number;
    amountConfidence: number;
  };
}

/**
 * 音声認識結果を解析
 */
export const parseSpeechResult = (transcript: string): ParsedSpeechResult => {
  if (!transcript) {
    return {
      transcript: '',
      confidence: 0,
      parsingDetails: {
        dateFound: false,
        amountFound: false,
        dateConfidence: 0,
        amountConfidence: 0
      }
    };
  }

  // テキストを正規化
  const normalizedText = normalizeText(transcript);
  
  // 日付を抽出
  const dateResult = extractDateFromSpeech(normalizedText);
  
  // 金額を抽出
  const amountResult = extractAmountFromSpeech(normalizedText);
  
  // 全体の信頼度を計算
  const overallConfidence = calculateOverallConfidence(dateResult, amountResult);
  
  return {
    transcript: normalizedText,
    date: dateResult.value,
    amount: amountResult.value,
    confidence: overallConfidence,
    parsingDetails: {
      dateFound: !!dateResult.value,
      amountFound: !!amountResult.value,
      dateConfidence: dateResult.confidence,
      amountConfidence: amountResult.confidence
    }
  };
};

/**
 * テキストを正規化
 */
const normalizeText = (text: string): string => {
  let normalized = text.trim();
  
  // 全角文字を半角に変換
  normalized = convertFullwidthToHalfwidth(normalized);
  
  // よくある音声認識の誤りを修正
  normalized = correctCommonSpeechErrors(normalized);
  
  // スペースの正規化
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
};

/**
 * 全角文字を半角に変換
 */
const convertFullwidthToHalfwidth = (text: string): string => {
  let converted = text;
  
  for (const [fullwidth, halfwidth] of Object.entries(FULLWIDTH_TO_HALFWIDTH)) {
    converted = converted.replace(new RegExp(fullwidth, 'g'), halfwidth);
  }
  
  return converted;
};

/**
 * よくある音声認識の誤りを修正
 */
const correctCommonSpeechErrors = (text: string): string => {
  let corrected = text;
  
  // 音声認識でよく間違えられる文字の修正
  const corrections: { [key: string]: string } = {
    'ぜろ': '0', 'れい': '0', 'ゼロ': '0',
    'いち': '1', 'イチ': '1',
    'に': '2', 'ニ': '2',
    'さん': '3', 'サン': '3',
    'よん': '4', 'ヨン': '4', 'し': '4', 'シ': '4',
    'ご': '5', 'ゴ': '5',
    'ろく': '6', 'ロク': '6',
    'なな': '7', 'ナナ': '7', 'しち': '7', 'シチ': '7',
    'はち': '8', 'ハチ': '8',
    'きゅう': '9', 'キュウ': '9', 'く': '9', 'ク': '9',
    'じゅう': '10', 'ジュウ': '10',
    'ひゃく': '100', 'ヒャク': '100',
    'せん': '1000', 'セン': '1000',
    'まん': '10000', 'マン': '10000',
    'おく': '100000000', 'オク': '100000000'
  };
  
  for (const [incorrect, correct] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(incorrect, 'g'), correct);
  }
  
  return corrected;
};

/**
 * 音声から日付を抽出
 */
const extractDateFromSpeech = (text: string): { value?: string; confidence: number } => {
  const currentYear = new Date().getFullYear();
  
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = parseDateMatch(match, currentYear);
        if (date) {
          return { value: date, confidence: 0.9 };
        }
      } catch (error) {
        console.warn('日付パースに失敗:', match, error);
        continue;
      }
    }
  }
  
  return { value: undefined, confidence: 0 };
};

/**
 * 日付マッチをパース
 */
const parseDateMatch = (match: RegExpMatchArray, currentYear: number): string | undefined => {
  if (match.length === 4) {
    // YYYY年MM月DD日 または YYYY/MM/DD
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    
    if (isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  } else if (match.length === 3) {
    // MM月DD日 または MM/DD
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
    if (isValidDate(currentYear, month, day)) {
      return formatDate(currentYear, month, day);
    }
  } else if (match.length === 3 && match[0].includes('月') && match[0].includes('日')) {
    // 漢数字の日付
    const month = parseKanjiNumber(match[1]);
    const day = parseKanjiNumber(match[2]);
    
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDate(currentYear, month, day);
    }
  }
  
  return undefined;
};

/**
 * 漢数字を数値に変換
 */
const parseKanjiNumber = (kanji: string): number => {
  if (kanji === '十') return 10;
  
  let result = 0;
  let current = 0;
  
  for (const char of kanji) {
    if (char === '十') {
      if (current === 0) {
        current = 10;
      } else {
        result += current * 10;
        current = 0;
      }
    } else if (char in KANJI_NUMBERS) {
      current = KANJI_NUMBERS[char];
    }
  }
  
  result += current;
  return result;
};

/**
 * 日付の妥当性をチェック
 */
const isValidDate = (year: number, month: number, day: number): boolean => {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (month === 2 && isLeapYear(year)) {
    daysInMonth[1] = 29;
  }
  
  return day <= daysInMonth[month - 1];
};

/**
 * うるう年かチェック
 */
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
const formatDate = (year: number, month: number, day: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

/**
 * 音声から金額を抽出
 */
const extractAmountFromSpeech = (text: string): { value?: number; confidence: number } => {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const amount = parseAmountMatch(match[1]);
        if (amount !== undefined) {
          return { value: amount, confidence: 0.8 };
        }
      } catch (error) {
        console.warn('金額パースに失敗:', match, error);
        continue;
      }
    }
  }
  
  return { value: undefined, confidence: 0 };
};

/**
 * 金額マッチをパース
 */
const parseAmountMatch = (amountStr: string): number | undefined => {
  // カンマを除去
  const cleanAmount = amountStr.replace(/,/g, '');
  
  // 数字のみの場合はそのままパース
  if (/^\d+$/.test(cleanAmount)) {
    const amount = parseInt(cleanAmount, 10);
    return isNaN(amount) ? undefined : amount;
  }
  
  // 漢数字の場合は変換
  if (/[一二三四五六七八九十百千万億]/.test(cleanAmount)) {
    return parseKanjiAmount(cleanAmount);
  }
  
  return undefined;
};

/**
 * 漢数字の金額をパース
 */
const parseKanjiAmount = (kanjiAmount: string): number | undefined => {
  let result = 0;
  let current = 0;
  let multiplier = 1;
  
  for (let i = 0; i < kanjiAmount.length; i++) {
    const char = kanjiAmount[i];
    
    if (char in KANJI_NUMBERS) {
      const value = KANJI_NUMBERS[char];
      
      if (value >= 10000) {
        // 万、億の処理
        if (current > 0) {
          result += current * multiplier;
          current = 0;
        }
        multiplier = value;
      } else if (value >= 1000) {
        // 千の処理
        if (current > 0) {
          result += current * 1000;
          current = 0;
        }
        current = 1;
      } else if (value >= 100) {
        // 百の処理
        if (current > 0) {
          result += current * 100;
          current = 0;
        }
        current = 1;
      } else if (value >= 10) {
        // 十の処理
        if (current === 0) {
          current = 1;
        }
        current *= 10;
      } else {
        // 1-9の処理
        current = value;
      }
    }
  }
  
  result += current * multiplier;
  return result;
};

/**
 * 全体の信頼度を計算
 */
const calculateOverallConfidence = (
  dateResult: { value?: string; confidence: number },
  amountResult: { value?: number; confidence: number }
): number => {
  let totalConfidence = 0;
  let count = 0;
  
  if (dateResult.value) {
    totalConfidence += dateResult.confidence;
    count++;
  }
  
  if (amountResult.value) {
    totalConfidence += amountResult.confidence;
    count++;
  }
  
  // 最低信頼度を保証
  const baseConfidence = 0.3;
  
  if (count === 0) {
    return baseConfidence;
  }
  
  return Math.max(baseConfidence, totalConfidence / count);
};

/**
 * 音声認識結果の品質を評価
 */
export const evaluateSpeechQuality = (transcript: string): {
  quality: 'high' | 'medium' | 'low';
  score: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 100;
  
  // 長さチェック
  if (transcript.length < 5) {
    issues.push('音声が短すぎます');
    score -= 30;
  } else if (transcript.length > 200) {
    issues.push('音声が長すぎます');
    score -= 20;
  }
  
  // 数字の存在チェック
  if (!/\d/.test(transcript)) {
    issues.push('数字が含まれていません');
    score -= 25;
  }
  
  // 日付・金額のキーワードチェック
  const hasDateKeywords = /(日付|日|月|年|時|分)/.test(transcript);
  const hasAmountKeywords = /(円|万|千|百|合計|金額)/.test(transcript);
  
  if (!hasDateKeywords && !hasAmountKeywords) {
    issues.push('日付・金額のキーワードが見つかりません');
    score -= 20;
  }
  
  // 品質判定
  let quality: 'high' | 'medium' | 'low';
  if (score >= 80) {
    quality = 'high';
  } else if (score >= 60) {
    quality = 'medium';
  } else {
    quality = 'low';
  }
  
  return { quality, score, issues };
};

/**
 * 音声認識結果を改善するためのヒントを生成
 */
export const generateImprovementHints = (transcript: string): string[] => {
  const hints: string[] = [];
  
  if (transcript.length < 10) {
    hints.push('もう少し詳しく話してください');
  }
  
  if (!/\d/.test(transcript)) {
    hints.push('数字を明確に発音してください');
  }
  
  if (!/(日付|日|月|年)/.test(transcript)) {
    hints.push('日付を「8月12日」のように話してください');
  }
  
  if (!/(円|万|千|百)/.test(transcript)) {
    hints.push('金額を「3480円」のように話してください');
  }
  
  if (hints.length === 0) {
    hints.push('良い音声認識結果です！');
  }
  
  return hints;
};
