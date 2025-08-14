import { PSM } from 'tesseract.js';

// ROI（関心領域）の定義
export interface RegionOfInterest {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'amount' | 'date';
  confidence: number;
}

// キーワードの定義
const AMOUNT_KEYWORDS = [
  '¥', '円', '合計', 'TOTAL', '小計', '税込', '税抜', '支払', '請求', '金額',
  'AMOUNT', 'SUM', 'GRAND TOTAL', 'FINAL TOTAL', 'DUE'
];

const DATE_KEYWORDS = [
  '日付', 'DATE', '発行', '購入', '取引', 'TRANSACTION', 'ISSUED', 'PURCHASE',
  '年', '月', '日', '時', '分', '秒'
];

// 日付パターン
const DATE_PATTERNS = [
  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  /\b(20\d{2})[-/\.](0?[1-9]|1[0-2])[-/\.](0?[1-9]|[12]\d|3[01])\b/,
  // MM-DD, MM/DD, MM.DD
  /\b(0?[1-9]|1[0-2])[-/\.](0?[1-9]|[12]\d|3[01])\b/,
  // 日本語形式: YYYY年MM月DD日
  /\b(20\d{2})年(0?[1-9]|1[0-2])月(0?[1-9]|[12]\d|3[01])日\b/,
  // 日本語形式: MM月DD日
  /\b(0?[1-9]|1[0-2])月(0?[1-9]|[12]\d|3[01])日\b/
];

// 金額パターン
const AMOUNT_PATTERNS = [
  // ¥1,234, 1,234円, 1234円
  /(?:¥|\b)([\d,]{1,12})(?:\.\d{1,2})?円?\b/,
  // TOTAL: 1,234, TOTAL 1,234
  /\b(?:TOTAL|合計|小計|税込|税抜)\s*[:：]?\s*([\d,]{1,12})(?:\.\d{1,2})?\b/,
  // 単純な数値（3桁以上）
  /\b(\d{3,12})\b/
];

/**
 * 1段階目の認識結果からROIを抽出
 */
export const extractROIs = (
  words: Tesseract.Word[],
  canvasWidth: number,
  canvasHeight: number
): RegionOfInterest[] => {
  const rois: RegionOfInterest[] = [];
  
  // 金額のROIを検出
  const amountROIs = detectAmountROIs(words, canvasWidth, canvasHeight);
  rois.push(...amountROIs);
  
  // 日付のROIを検出
  const dateROIs = detectDateROIs(words, canvasWidth, canvasHeight);
  rois.push(...dateROIs);
  
  // 重複するROIを統合
  return mergeOverlappingROIs(rois);
};

/**
 * 金額のROIを検出
 */
const detectAmountROIs = (
  words: Tesseract.Word[],
  canvasWidth: number,
  canvasHeight: number
): RegionOfInterest[] => {
  const rois: RegionOfInterest[] = [];
  
  for (const word of words) {
    const text = word.text.toLowerCase();
    
    // 金額キーワードを含む単語を検出
    const hasAmountKeyword = AMOUNT_KEYWORDS.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (hasAmountKeyword) {
      // キーワードの周囲を拡張してROIを作成
      const roi = expandRegion(word, canvasWidth, canvasHeight, 'amount');
      rois.push(roi);
    }
    
    // 金額パターンにマッチする単語を検出
    for (const pattern of AMOUNT_PATTERNS) {
      if (pattern.test(text)) {
        const roi = expandRegion(word, canvasWidth, canvasHeight, 'amount');
        roi.confidence = 0.8; // パターンマッチの場合は信頼度を上げる
        rois.push(roi);
        break;
      }
    }
  }
  
  return rois;
};

/**
 * 日付のROIを検出
 */
const detectDateROIs = (
  words: Tesseract.Word[],
  canvasWidth: number,
  canvasHeight: number
): RegionOfInterest[] => {
  const rois: RegionOfInterest[] = [];
  
  for (const word of words) {
    const text = word.text;
    
    // 日付キーワードを含む単語を検出
    const hasDateKeyword = DATE_KEYWORDS.some(keyword => 
      text.includes(keyword)
    );
    
    if (hasDateKeyword) {
      // キーワードの周囲を拡張してROIを作成
      const roi = expandRegion(word, canvasWidth, canvasHeight, 'date');
      rois.push(roi);
    }
    
    // 日付パターンにマッチする単語を検出
    for (const pattern of DATE_PATTERNS) {
      if (pattern.test(text)) {
        const roi = expandRegion(word, canvasWidth, canvasHeight, 'date');
        roi.confidence = 0.9; // パターンマッチの場合は信頼度を上げる
        rois.push(roi);
        break;
      }
    }
  }
  
  return rois;
};

/**
 * 単語の領域を拡張してROIを作成
 */
const expandRegion = (
  word: Tesseract.Word,
  canvasWidth: number,
  canvasHeight: number,
  type: 'amount' | 'date'
): RegionOfInterest => {
  const { bbox } = word;
  
  // 領域を適切に拡張
  const expansionFactor = type === 'amount' ? 2.0 : 1.5;
  const expandedWidth = bbox.width * expansionFactor;
  const expandedHeight = bbox.height * expansionFactor;
  
  // 中心を基準に拡張
  const centerX = bbox.x0 + bbox.width / 2;
  const centerY = bbox.y0 + bbox.height / 2;
  
  const x = Math.max(0, centerX - expandedWidth / 2);
  const y = Math.max(0, centerY - expandedHeight / 2);
  const width = Math.min(canvasWidth - x, expandedWidth);
  const height = Math.min(canvasHeight - y, expandedHeight);
  
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
    type,
    confidence: 0.7
  };
};

/**
 * 重複するROIを統合
 */
const mergeOverlappingROIs = (rois: RegionOfInterest[]): RegionOfInterest[] => {
  if (rois.length <= 1) return rois;
  
  const merged: RegionOfInterest[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < rois.length; i++) {
    if (used.has(i)) continue;
    
    let currentRoi = rois[i];
    used.add(i);
    
    // 他のROIと重複チェック
    for (let j = i + 1; j < rois.length; j++) {
      if (used.has(j)) continue;
      
      if (hasOverlap(currentRoi, rois[j])) {
        // 重複する場合は統合
        currentRoi = mergeROIs(currentRoi, rois[j]);
        used.add(j);
      }
    }
    
    merged.push(currentRoi);
  }
  
  return merged;
};

/**
 * 2つのROIが重複しているかチェック
 */
const hasOverlap = (roi1: RegionOfInterest, roi2: RegionOfInterest): boolean => {
  return !(
    roi1.x + roi1.width < roi2.x ||
    roi2.x + roi2.width < roi1.x ||
    roi1.y + roi1.height < roi2.y ||
    roi2.y + roi2.height < roi1.y
  );
};

/**
 * 2つのROIを統合
 */
const mergeROIs = (roi1: RegionOfInterest, roi2: RegionOfInterest): RegionOfInterest => {
  const x = Math.min(roi1.x, roi2.x);
  const y = Math.min(roi1.y, roi2.y);
  const width = Math.max(roi1.x + roi1.width, roi2.x + roi2.width) - x;
  const height = Math.max(roi1.y + roi1.height, roi2.y + roi2.height) - y;
  
  return {
    x,
    y,
    width,
    height,
    type: roi1.type, // 同じタイプのROIのみ統合
    confidence: Math.max(roi1.confidence, roi2.confidence)
  };
};

/**
 * ROIからCanvasを切り出し
 */
export const extractCanvasFromROI = (
  sourceCanvas: HTMLCanvasElement,
  roi: RegionOfInterest
): HTMLCanvasElement => {
  const { x, y, width, height } = roi;
  
  const extractedCanvas = document.createElement('canvas');
  const ctx = extractedCanvas.getContext('2d')!;
  
  extractedCanvas.width = width;
  extractedCanvas.height = height;
  
  // ROIの領域を切り出し
  ctx.drawImage(
    sourceCanvas,
    x, y, width, height,
    0, 0, width, height
  );
  
  return extractedCanvas;
};

/**
 * ROIの優先度を計算（信頼度とサイズに基づく）
 */
export const calculateROIPriority = (roi: RegionOfInterest): number => {
  // 信頼度（0.7-1.0）を0.7-1.0の範囲に正規化
  const confidenceScore = (roi.confidence - 0.7) / 0.3;
  
  // サイズスコア（適度なサイズを好む）
  const area = roi.width * roi.height;
  const idealArea = 10000; // 100x100ピクセルを理想とする
  const sizeScore = Math.exp(-Math.abs(area - idealArea) / idealArea);
  
  // タイプ別の重み
  const typeWeight = roi.type === 'amount' ? 1.2 : 1.0;
  
  return (confidenceScore * 0.6 + sizeScore * 0.4) * typeWeight;
};

/**
 * ROIを優先度順にソート
 */
export const sortROIsByPriority = (rois: RegionOfInterest[]): RegionOfInterest[] => {
  return [...rois].sort((a, b) => {
    const priorityA = calculateROIPriority(a);
    const priorityB = calculateROIPriority(b);
    return priorityB - priorityA;
  });
};
