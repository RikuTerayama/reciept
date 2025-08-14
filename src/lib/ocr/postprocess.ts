// 日付パターンの定義
const DATE_PATTERNS = [
  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  /^(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})$/,
  // MM-DD, MM/DD, MM.DD (年は当年)
  /^(\d{1,2})[-/\.](\d{1,2})$/,
  // 日本語形式: YYYY年MM月DD日
  /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
  // 日本語形式: MM月DD日 (年は当年)
  /^(\d{1,2})月(\d{1,2})日$/,
  // 日本語形式: MM月DD日 (年は当年、漢数字対応)
  /^([一二三四五六七八九十]+)月([一二三四五六七八九十]+)日$/,
  // 特殊形式: YYYY年MM月DD日
  /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/
];

// 金額パターンの定義
const AMOUNT_PATTERNS = [
  // ¥1,234, 1,234円, 1234円
  /^(?:¥|\b)?([\d,]+)(?:\.\d{1,2})?円?$/,
  // 1,234.56
  /^([\d,]+\.\d{1,2})$/,
  // 1234 (3桁以上)
  /^(\d{3,12})$/
];

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
  '．': '.', '，': ',', '：': ':', '－': '-', '／': '/',
  '（': '(', '）': ')', '［': '[', '］': ']', '｛': '{', '｝': '}',
  'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E',
  'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I', 'Ｊ': 'J',
  'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O',
  'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T',
  'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y', 'Ｚ': 'Z'
};

/**
 * テキストを正規化
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  let normalized = text.trim();
  
  // 全角文字を半角に変換
  normalized = convertFullwidthToHalfwidth(normalized);
  
  // よくある誤読を修正
  normalized = correctCommonMisreadings(normalized);
  
  // 重複するカンマを除去
  normalized = removeDuplicateCommas(normalized);
  
  // 前後の空白を除去
  normalized = normalized.trim();
  
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
 * よくある誤読を修正
 */
const correctCommonMisreadings = (text: string): string => {
  let corrected = text;
  
  // O/S → 0 の修正
  corrected = corrected.replace(/[OS]/g, '0');
  
  // l → 1 の修正（文脈依存）
  corrected = corrected.replace(/\bl(?=\d)/g, '1');
  
  // スペースの正規化
  corrected = corrected.replace(/\s+/g, ' ');
  
  return corrected;
};

/**
 * 重複するカンマを除去
 */
const removeDuplicateCommas = (text: string): string => {
  return text.replace(/,+/g, ',');
};

/**
 * 日付を抽出・正規化
 */
export const extractDate = (text: string): string | undefined => {
  if (!text) return undefined;
  
  const normalizedText = normalizeText(text);
  
  // 各パターンでマッチング
  for (const pattern of DATE_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      try {
        return parseDateMatch(match);
      } catch (error) {
        console.warn('Date parsing failed for match:', match, error);
        continue;
      }
    }
  }
  
  return undefined;
};

/**
 * 日付マッチをパース
 */
const parseDateMatch = (match: RegExpMatchArray): string => {
  const currentYear = new Date().getFullYear();
  
  if (match.length === 4) {
    // YYYY-MM-DD 形式
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    
    if (isValidDate(year, month, day)) {
      return formatDate(year, month, day);
    }
  } else if (match.length === 3) {
    // MM-DD 形式（年は当年）
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
    if (isValidDate(currentYear, month, day)) {
      return formatDate(currentYear, month, day);
    }
  }
  
  throw new Error('Invalid date format');
};

/**
 * 漢数字の日付をパース
 */
const parseKanjiDate = (text: string): string | undefined => {
  // 漢数字の月と日を抽出
  const monthMatch = text.match(/([一二三四五六七八九十]+)月/);
  const dayMatch = text.match(/([一二三四五六七八九十]+)日/);
  
  if (monthMatch && dayMatch) {
    const month = parseKanjiNumber(monthMatch[1]);
    const day = parseKanjiNumber(dayMatch[1]);
    const currentYear = new Date().getFullYear();
    
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
  
  // 月別の日数チェック
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // うるう年の調整
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
 * 金額を抽出・正規化
 */
export const extractAmount = (text: string): number | undefined => {
  if (!text) return undefined;
  
  const normalizedText = normalizeText(text);
  
  // 各パターンでマッチング
  for (const pattern of AMOUNT_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      try {
        return parseAmountMatch(match[1]);
      } catch (error) {
        console.warn('Amount parsing failed for match:', match, error);
        continue;
      }
    }
  }
  
  return undefined;
};

/**
 * 金額マッチをパース
 */
const parseAmountMatch = (amountStr: string): number => {
  // カンマを除去
  const cleanAmount = amountStr.replace(/,/g, '');
  
  // 小数点以下がある場合は整数に変換
  const amount = parseFloat(cleanAmount);
  
  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount');
  }
  
  // 整数として返す（小数点以下は切り捨て）
  return Math.floor(amount);
};

/**
 * 複数の候補から最適な日付を選択
 */
export const selectBestDate = (candidates: string[]): string | undefined => {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  
  // 現在の日付を基準に評価
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  
  let bestDate: string | undefined;
  let bestScore = -1;
  
  for (const candidate of candidates) {
    try {
      const score = evaluateDateCandidate(candidate, currentYear, currentMonth, currentDay);
      if (score > bestScore) {
        bestScore = score;
        bestDate = candidate;
      }
    } catch (error) {
      console.warn('Date evaluation failed for:', candidate, error);
      continue;
    }
  }
  
  return bestDate;
};

/**
 * 日付候補を評価
 */
const evaluateDateCandidate = (dateStr: string, currentYear: number, currentMonth: number, currentDay: number): number => {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  let score = 0;
  
  // 年が現在に近いほど高スコア
  const yearDiff = Math.abs(year - currentYear);
  score += Math.max(0, 10 - yearDiff);
  
  // 月が現在に近いほど高スコア
  const monthDiff = Math.abs(month - currentMonth);
  score += Math.max(0, 5 - monthDiff);
  
  // 日が現在に近いほど高スコア
  const dayDiff = Math.abs(day - currentDay);
  score += Math.max(0, 3 - dayDiff);
  
  return score;
};

/**
 * 複数の候補から最適な金額を選択
 */
export const selectBestAmount = (candidates: number[]): number | undefined => {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  
  // 金額の妥当性をチェック
  const validCandidates = candidates.filter(amount => 
    amount > 0 && amount < 10000000 // 1000万円未満
  );
  
  if (validCandidates.length === 0) return undefined;
  
  // 中央値を返す（外れ値の影響を避ける）
  validCandidates.sort((a, b) => a - b);
  const mid = Math.floor(validCandidates.length / 2);
  
  if (validCandidates.length % 2 === 0) {
    return Math.round((validCandidates[mid - 1] + validCandidates[mid]) / 2);
  } else {
    return validCandidates[mid];
  }
};

/**
 * OCR結果を統合・後処理
 */
export const postprocessOCRResult = (
  rawText: string,
  rois: Array<{ text: string; type: 'amount' | 'date'; confidence: number }>
): {
  rawText: string;
  date?: string;
  amount?: number;
  confidence: number;
} => {
  const normalizedRawText = normalizeText(rawText);
  
  // 全体テキストから日付と金額を抽出
  const mainDate = extractDate(normalizedRawText);
  const mainAmount = extractAmount(normalizedRawText);
  
  // ROIからも抽出
  const roiDates: string[] = [];
  const roiAmounts: number[] = [];
  
  for (const roi of rois) {
    const normalizedRoiText = normalizeText(roi.text);
    
    if (roi.type === 'date') {
      const date = extractDate(normalizedRoiText);
      if (date) roiDates.push(date);
    } else if (roi.type === 'amount') {
      const amount = extractAmount(normalizedRoiText);
      if (amount) roiAmounts.push(amount);
    }
  }
  
  // 最適な値を選択
  const allDates = [mainDate, ...roiDates].filter(Boolean) as string[];
  const allAmounts = [mainAmount, ...roiAmounts].filter(Boolean) as number[];
  
  const finalDate = selectBestDate(allDates);
  const finalAmount = selectBestAmount(allAmounts);
  
  // 信頼度を計算
  const confidence = calculateOverallConfidence(rois, finalDate, finalAmount);
  
  return {
    rawText: normalizedRawText,
    date: finalDate,
    amount: finalAmount,
    confidence
  };
};

/**
 * 全体の信頼度を計算
 */
const calculateOverallConfidence = (
  rois: Array<{ type: 'amount' | 'date'; confidence: number }>,
  date?: string,
  amount?: number
): number => {
  let totalConfidence = 0;
  let count = 0;
  
  // ROIの信頼度を平均
  for (const roi of rois) {
    totalConfidence += roi.confidence;
    count++;
  }
  
  // 抽出結果の有無で調整
  if (date) totalConfidence += 0.8;
  if (amount) totalConfidence += 0.8;
  
  count += (date ? 1 : 0) + (amount ? 1 : 0);
  
  return count > 0 ? totalConfidence / count : 0;
};
