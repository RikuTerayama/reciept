import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';
import { preprocessImageForOCR } from './receipt-detection';

// Web Workerを使用したOCR処理
let ocrWorker: Worker | null = null;

function getOCRWorker(): Worker {
  if (!ocrWorker) {
    ocrWorker = new Worker('/ocr-worker.js');
  }
  return ocrWorker;
}

// 画像前処理関数（最適化版）
async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // キャンバスサイズを設定（最大1200pxに制限して処理速度を向上）
      const maxSize = 1200;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);
      
      // グレースケール化（最適化）
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // より効率的なグレースケール変換
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 軽量なコントラスト強化
      ctx.filter = 'contrast(1.2) brightness(1.02)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      
      resolve(canvas);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// ImageUpload.tsxで使用するためのprocessImageWithOCR関数
export async function processImageWithOCR(file: File): Promise<OCRResult> {
  return await extractTextFromImage(file);
}

export async function extractTextFromImage(file: File): Promise<OCRResult> {
  try {
    // 画像前処理を実行
    const preprocessedCanvas = await preprocessImageForOCR(file);
    
    // Web Workerを使用したOCR処理
    const text = await processWithWorker(preprocessedCanvas);
    
    console.log('OCR抽出テキスト:', text);

    return {
      date: extractDate(text),
      totalAmount: extractTotalAmount(text),
      taxRate: extractTaxRate(text),
      isQualified: checkQualifiedInvoice(text),
      text: text
    };
  } catch (error) {
    console.error('OCR処理エラー:', error);
    throw new Error('画像の処理中にエラーが発生しました');
  }
}

// Web Workerを使用したOCR処理
async function processWithWorker(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = getOCRWorker();
    const id = Date.now().toString();
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      
      switch (e.data.type) {
        case 'complete':
          worker.removeEventListener('message', handleMessage);
          resolve(e.data.result);
          break;
        case 'error':
          worker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
          break;
        case 'progress':
          // 進捗は無視（必要に応じてUIに反映可能）
          break;
      }
    };
    
    worker.addEventListener('message', handleMessage);
    
    // キャンバスをBlobに変換してWorkerに送信
    canvas.toBlob((blob) => {
      if (blob) {
        worker.postMessage({ blob, id });
      } else {
        reject(new Error('キャンバスの変換に失敗しました'));
      }
    }, 'image/jpeg', 0.9);
  });
}

// 最適化された同期処理（フォールバック用）
async function processWithTesseract(canvas: HTMLCanvasElement): Promise<string> {
  const result = await Tesseract.recognize(canvas, 'jpn+eng', {
    logger: (m: any) => console.log(m),
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン年月日時分秒円¥￥,./\\-:：',
    tessedit_pageseg_mode: (Tesseract as any).PSM.SINGLE_BLOCK,
    tessedit_ocr_engine_mode: (Tesseract as any).OEM.LSTM_ONLY,
    tessedit_do_invert: '0',
    tessedit_image_border: '0',
    tessedit_adaptive_threshold: '1',
    tessedit_adaptive_method: '1',
    // 処理速度向上のための追加設定
    tessedit_do_ocr: '1',
    tessedit_do_bayes_net: '0',
    tessedit_do_old_tess: '0',
    tessedit_do_tess: '0',
    tessedit_do_unlv: '0',
    tessedit_do_xform_ocr: '0'
  } as any);

  return result.data.text;
}

function extractDate(text: string): string | undefined {
  // テキストの正規化（全角→半角、空白除去）
  const normalizedText = text
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, ' ')
    .trim();

  console.log('正規化されたテキスト:', normalizedText);

  // 日付パターンの定義（優先度順）
  const datePatterns = [
    // 1. YYYY-MM-DD, YYYY/MM/DD
    {
      pattern: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g,
      handler: (match: string) => {
        const parts = match.split(/[-/]/);
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    },
    // 2. YYYY年MM月DD日
    {
      pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
      handler: (match: string) => {
        const year = match.match(/(\d{4})年/)?.[1];
        const month = match.match(/(\d{1,2})月/)?.[1]?.padStart(2, '0');
        const day = match.match(/(\d{1,2})日/)?.[1]?.padStart(2, '0');
        if (year && month && day) {
          return `${year}-${month}-${day}`;
        }
        return null;
      }
    },
    // 3. MM/DD/YYYY (アメリカ形式)
    {
      pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      handler: (match: string) => {
        const parts = match.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    },
    // 4. DD/MM/YYYY (ヨーロッパ形式)
    {
      pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      handler: (match: string) => {
        const parts = match.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    },
    // 5. YYYY.MM.DD
    {
      pattern: /(\d{4})\.(\d{1,2})\.(\d{1,2})/g,
      handler: (match: string) => {
        const parts = match.split('.');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    },
    // 6. 英語の月名 (Jul 24, 2024, 24 July 2024)
    {
      pattern: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi,
      handler: (match: string) => {
        const monthNames: { [key: string]: string } = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const parts = match.replace(',', '').split(/\s+/);
        const month = monthNames[parts[0].toLowerCase()];
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    },
    // 7. 英語の月名（日が先）(24 July 2024)
    {
      pattern: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi,
      handler: (match: string) => {
        const monthNames: { [key: string]: string } = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const parts = match.split(/\s+/);
        const day = parts[0].padStart(2, '0');
        const month = monthNames[parts[1].toLowerCase()];
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    },
    // 8. 和暦（R6.07.24形式）- 無視せずに処理
    {
      pattern: /R(\d{1,2})\.(\d{1,2})\.(\d{1,2})/g,
      handler: (match: string) => {
        const parts = match.split('.');
        const reiwaYear = parseInt(parts[0].substring(1));
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const gregorianYear = 2018 + reiwaYear; // 令和元年は2019年
        return `${gregorianYear}-${month}-${day}`;
      }
    }
  ];

  // 各パターンを試行
  for (const { pattern, handler } of datePatterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        try {
          const result = handler(match);
          if (result) {
            // 日付の妥当性チェック
            const date = new Date(result);
            if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2030) {
              console.log('日付マッチ:', match, '→', result);
              return result;
            }
          }
        } catch (error) {
          console.log('日付パースエラー:', error);
        }
      }
    }
  }

  // 曖昧な形式の処理（MM/DD/YYYY vs DD/MM/YYYY）
  const ambiguousPattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
  const ambiguousMatches = normalizedText.match(ambiguousPattern);
  
  if (ambiguousMatches && ambiguousMatches.length > 0) {
    for (const match of ambiguousMatches) {
      const parts = match.split('/');
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      const year = parts[2];
      
      // 月として妥当な値かチェック
      if (first <= 12 && second <= 31) {
        // MM/DD/YYYYとして試行
        const mmddResult = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        const mmddDate = new Date(mmddResult);
        
        if (!isNaN(mmddDate.getTime()) && mmddDate.getFullYear() >= 2000 && mmddDate.getFullYear() <= 2030) {
          console.log('曖昧な日付（MM/DD/YYYYとして解釈）:', match, '→', mmddResult);
          return mmddResult;
        }
      }
      
      if (second <= 12 && first <= 31) {
        // DD/MM/YYYYとして試行
        const ddmmResult = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        const ddmmDate = new Date(ddmmResult);
        
        if (!isNaN(ddmmDate.getTime()) && ddmmDate.getFullYear() >= 2000 && ddmmDate.getFullYear() <= 2030) {
          console.log('曖昧な日付（DD/MM/YYYYとして解釈）:', match, '→', ddmmResult);
          return ddmmResult;
        }
      }
    }
  }

  console.log('日付が見つかりませんでした');
  return undefined;
}

function extractTotalAmount(text: string): number | undefined {
  // テキストの正規化（全角→半角、空白除去）
  const normalizedText = text
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[￥]/g, '¥')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('金額抽出用正規化テキスト:', normalizedText);

  // 金額候補を格納する配列
  const amountCandidates: Array<{ amount: number; priority: number; source: string }> = [];

  // 1. 合計・小計・総計などのキーワード付き金額（最高優先度）
  const totalKeywords = [
    /(?:合計|小計|総計|total|subtotal|amount|sum|請求額|税込合計|税抜合計)[\s:：]*([¥￥]?[\d,]+)/gi,
    /(?:税込|税抜|税抜き|税込み)[\s:：]*([¥￥]?[\d,]+)/gi,
    /(?:消費税|tax)[\s:：]*([¥￥]?[\d,]+)/gi,
  ];

  for (const pattern of totalKeywords) {
    const matches = normalizedText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const amountMatch = match.match(/[¥￥]?([\d,]+)/);
        if (amountMatch) {
          const amountStr = amountMatch[1].replace(/,/g, '');
          const amount = parseInt(amountStr);
          if (amount >= 100 && amount <= 1000000) {
            amountCandidates.push({
              amount,
              priority: 10,
              source: match
            });
            console.log('キーワード付き金額:', match, '→', amount);
          }
        }
      }
    }
  }

  // 2. 通貨記号付き金額（高優先度）
  const currencyPattern = /[¥￥]([\d,]+)/g;
  let currencyMatch;
  while ((currencyMatch = currencyPattern.exec(normalizedText)) !== null) {
    const amountStr = currencyMatch[1].replace(/,/g, '');
    const amount = parseInt(amountStr);
    if (amount >= 100 && amount <= 1000000) {
      amountCandidates.push({
        amount,
        priority: 8,
        source: currencyMatch[0]
      });
      console.log('通貨記号付き金額:', currencyMatch[0], '→', amount);
    }
  }

  // 3. 円記号付き金額
  const yenPattern = /([\d,]+)円/g;
  let yenMatch;
  while ((yenMatch = yenPattern.exec(normalizedText)) !== null) {
    const amountStr = yenMatch[1].replace(/,/g, '');
    const amount = parseInt(amountStr);
    if (amount >= 100 && amount <= 1000000) {
      amountCandidates.push({
        amount,
        priority: 7,
        source: yenMatch[0]
      });
      console.log('円記号付き金額:', yenMatch[0], '→', amount);
    }
  }

  // 4. 3桁以上の数字（カンマ区切りあり）
  const commaPattern = /([\d]{1,3}(?:,[\d]{3})*)/g;
  let commaMatch;
  while ((commaMatch = commaPattern.exec(normalizedText)) !== null) {
    const amountStr = commaMatch[1].replace(/,/g, '');
    const amount = parseInt(amountStr);
    if (amount >= 100 && amount <= 1000000) {
      amountCandidates.push({
        amount,
        priority: 5,
        source: commaMatch[0]
      });
      console.log('カンマ区切り金額:', commaMatch[0], '→', amount);
    }
  }

  // 5. 3桁以上の連続数字（カンマなし）
  const digitPattern = /([\d]{3,6})/g;
  let digitMatch;
  while ((digitMatch = digitPattern.exec(normalizedText)) !== null) {
    const amount = parseInt(digitMatch[1]);
    if (amount >= 100 && amount <= 1000000) {
      // 明らかに小さい金額や日付っぽい数字は除外
      if (amount < 1000 || (amount >= 1000 && amount <= 9999 && !isLikelyDate(amount))) {
        amountCandidates.push({
          amount,
          priority: 3,
          source: digitMatch[0]
        });
        console.log('連続数字金額:', digitMatch[0], '→', amount);
      }
    }
  }

  // 候補を優先度順にソート
  amountCandidates.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // 優先度の高い順
    }
    return b.amount - a.amount; // 同じ優先度なら金額の高い順
  });

  console.log('金額候補（優先度順）:', amountCandidates);

  // 最適な候補を選択
  if (amountCandidates.length > 0) {
    const bestCandidate = amountCandidates[0];
    console.log('選択された金額:', bestCandidate.source, '→', bestCandidate.amount);
    return bestCandidate.amount;
  }

  console.log('合計金額が抽出できませんでした');
  return undefined;
}

// 日付っぽい数字かどうかを判定するヘルパー関数
function isLikelyDate(num: number): boolean {
  const str = num.toString();
  if (str.length === 4) {
    const year = parseInt(str.substring(0, 2));
    const month = parseInt(str.substring(2, 4));
    return year >= 20 && year <= 99 && month >= 1 && month <= 12;
  }
  return false;
}

function extractTaxRate(text: string): number {
  // テキストの正規化
  const normalizedText = text
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, ' ')
    .trim();

  // 税率パターンの定義（優先度順）
  const taxPatterns = [
    // 1. 明示的な税率表記（最高優先度）
    /(?:税率|tax\s*rate)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    /(\d+(?:\.\d+)?)%\s*(?:税率|tax)/gi,
    /(?:軽減税率|reduced\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    /(?:標準税率|standard\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    
    // 2. 消費税の表記
    /(?:消費税|consumption\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    /(\d+(?:\.\d+)?)%\s*(?:消費税|consumption\s*tax)/gi,
    
    // 3. 税込み・税抜きの表記から推定
    /(?:税込|税込み|including\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    /(?:税抜|税抜き|excluding\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    
    // 4. 一般的な税率パターン
    /(\d+(?:\.\d+)?)%/g,
  ];

  for (const pattern of taxPatterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const rateMatch = match.match(/(\d+(?:\.\d+)?)%/);
        if (rateMatch) {
          const rate = parseFloat(rateMatch[1]);
          // 妥当な税率範囲（0-20%）かチェック
          if (rate >= 0 && rate <= 20) {
            console.log('税率マッチ:', match, '→', rate);
            return rate;
          }
        }
      }
    }
  }

  // 5. 文脈から税率を推定
  const contextPatterns = [
    // 軽減税率のキーワード
    /(?:軽減|reduced|food|飲食|食品)/gi,
    // 標準税率のキーワード
    /(?:標準|standard|一般|general)/gi,
  ];

  for (const pattern of contextPatterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      if (pattern.source.includes('軽減') || pattern.source.includes('reduced') || 
          pattern.source.includes('food') || pattern.source.includes('飲食') || 
          pattern.source.includes('食品')) {
        console.log('軽減税率の文脈を検出、8%を適用');
        return 8;
      }
    }
  }

  // デフォルトは10%（標準税率）
  console.log('税率が見つからないため、デフォルト10%を使用');
  return 10;
}

function checkQualifiedInvoice(text: string): boolean {
  // 適格請求書判定の改善
  const qualifiedPatterns = [
    // 登録番号のパターン（T+13桁数字）
    /T\d{13}/gi,
    // 登録番号の一般的なパターン
    /(?:登録番号|registration\s*number)[\s:：]*[T]?\d{13,}/gi,
    // 適格請求書の明示的な表記
    /(?:適格請求書|qualified\s*invoice)/gi,
    // インボイス制度対応の表記
    /(?:インボイス|invoice\s*system)/gi,
    // 消費税転嫁の表記
    /(?:消費税転嫁|tax\s*transfer)/gi,
  ];

  for (const pattern of qualifiedPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      console.log('適格請求書マッチ:', matches[0]);
      return true;
    }
  }

  // 非適格の表記があるかチェック
  const nonQualifiedPatterns = [
    /(?:非適格|non.?qualified)/gi,
    /(?:簡易課税|simplified\s*taxation)/gi,
    /(?:免税|tax\s*exempt)/gi,
  ];

  for (const pattern of nonQualifiedPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      console.log('非適格マッチ:', matches[0]);
      return false;
    }
  }

  console.log('適格性が判定できないため、非適格として扱います');
  return false;
}

export function validateOCRResult(result: OCRResult): string[] {
  const errors: string[] = [];

  if (!result.date) {
    errors.push('日付が抽出できませんでした');
  }

  if (!result.totalAmount) {
    errors.push('合計金額が抽出できませんでした');
  }

  if (result.totalAmount && result.totalAmount <= 0) {
    errors.push('抽出された金額が無効です');
  }

  return errors;
} 
