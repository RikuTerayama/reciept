import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';

// 画像前処理関数
async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // キャンバスサイズを設定（最大2000pxに制限）
      const maxSize = 2000;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);
      
      // グレースケール化
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // コントラスト強化
      ctx.filter = 'contrast(1.5) brightness(1.1)';
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
    // 画像前処理
    const preprocessedCanvas = await preprocessImage(file);
    
    const result = await Tesseract.recognize(preprocessedCanvas, 'jpn+eng', {
      logger: (m: any) => console.log(m),
      preserve_interword_spaces: 1,
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン年月日時分秒円¥￥,./\\-:：',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
    });

    const text = result.data.text;
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
        const monthNames = {
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
        const monthNames = {
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
  // 合計金額のパターンを改善
  const totalPatterns = [
    // 合計、小計、総計などのキーワード
    /(?:合計|小計|総計|total|subtotal|amount|sum)[\s:：]*([¥￥]?[\d,]+)/gi,
    // 金額のみ（最後の大きな金額を優先）
    /([¥￥]?[\d,]+)/g,
    // 税込み、税抜きの表記
    /(?:税込|税抜|税抜き|税込み)[\s:：]*([¥￥]?[\d,]+)/gi,
    // 消費税の表記
    /(?:消費税|tax)[\s:：]*([¥￥]?[\d,]+)/gi,
  ];

  let maxAmount = 0;
  let foundAmount = false;

  for (const pattern of totalPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        // 金額部分を抽出
        const amountMatch = match.match(/[¥￥]?([\d,]+)/);
        if (amountMatch) {
          const amountStr = amountMatch[1].replace(/,/g, '');
          const amount = parseInt(amountStr);
          
          if (amount > 0 && amount > maxAmount) {
            // 明らかに小さい金額（100円未満）は除外
            if (amount >= 100) {
              maxAmount = amount;
              foundAmount = true;
              console.log('金額マッチ:', match, '→', amount);
            }
          }
        }
      }
    }
  }

  if (foundAmount) {
    console.log('最終的な金額:', maxAmount);
    return maxAmount;
  }

  console.log('合計金額が抽出できませんでした');
  return undefined;
}

function extractTaxRate(text: string): number {
  // 税率の抽出
  const taxPatterns = [
    /(?:税率|tax\s*rate)[\s:：]*(\d+(?:\.\d+)?)%/gi,
    /(\d+(?:\.\d+)?)%\s*(?:税率|tax)/gi,
    /(?:軽減税率|reduced\s*tax)[\s:：]*(\d+(?:\.\d+)?)%/gi,
  ];

  for (const pattern of taxPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const rateMatch = matches[0].match(/(\d+(?:\.\d+)?)%/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1]);
        console.log('税率マッチ:', rate);
        return rate;
      }
    }
  }

  // デフォルトは10%
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
