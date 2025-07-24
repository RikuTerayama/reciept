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
  // 日付パターンの改善
  const datePatterns = [
    // YYYY-MM-DD
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g,
    // YYYY年MM月DD日
    /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
    // MM/DD/YYYY
    /(\d{1,2})[/](\d{1,2})[/](\d{4})/g,
    // DD/MM/YYYY
    /(\d{1,2})[/](\d{1,2})[/](\d{4})/g,
    // YYYY.MM.DD
    /(\d{4})\.(\d{1,2})\.(\d{1,2})/g,
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const match = matches[0];
      console.log('日付マッチ:', match);
      
      // 日付形式を統一
      if (match.includes('年')) {
        // YYYY年MM月DD日 → YYYY-MM-DD
        const year = match.match(/(\d{4})年/)?.[1];
        const month = match.match(/(\d{1,2})月/)?.[1];
        const day = match.match(/(\d{1,2})日/)?.[1];
        if (year && month && day) {
          const paddedMonth = month.length < 2 ? '0' + month : month;
          const paddedDay = day.length < 2 ? '0' + day : day;
          return `${year}-${paddedMonth}-${paddedDay}`;
        }
      } else if (match.includes('/')) {
        // MM/DD/YYYY or DD/MM/YYYY → YYYY-MM-DD
        const parts = match.split('/');
        if (parts.length === 3) {
          const [first, second, third] = parts;
          // 4桁の数字が年と判断
          if (third.length === 4) {
            const paddedFirst = first.length < 2 ? '0' + first : first;
            const paddedSecond = second.length < 2 ? '0' + second : second;
            return `${third}-${paddedFirst}-${paddedSecond}`;
          } else if (first.length === 4) {
            const paddedSecond = second.length < 2 ? '0' + second : second;
            const paddedThird = third.length < 2 ? '0' + third : third;
            return `${first}-${paddedSecond}-${paddedThird}`;
          }
        }
      } else if (match.includes('.')) {
        // YYYY.MM.DD → YYYY-MM-DD
        return match.replace(/\./g, '-');
      } else {
        // YYYY-MM-DD or YYYY/MM/DD
        return match.replace(/\//g, '-');
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
