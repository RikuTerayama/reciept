import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';

export async function extractTextFromImage(file: File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(file, 'jpn+eng', {
      logger: m => console.log(m)
    });

    const text = result.data.text;
    
    // 基本的な情報抽出（簡易版）
    const extractedData = extractBasicInfo(text);
    
    return {
      text,
      ...extractedData
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('OCR処理中にエラーが発生しました');
  }
}

function extractBasicInfo(text: string): Partial<OCRResult> {
  const extracted: Partial<OCRResult> = {};
  
  // 日付の抽出
  const datePatterns = [
    /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/,
    /(\d{1,2})[月\/\-](\d{1,2})[日\/\-](\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let year, month, day;
      if (match[1].length === 4) {
        // YYYY-MM-DD 形式
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else {
        // MM-DD-YYYY 形式
        year = match[3];
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
      }
      extracted.date = `${year}-${month}-${day}`;
      break;
    }
  }
  
  // 金額の抽出
  const amountPatterns = [
    /(?:合計|総額|金額|小計|税込|税抜)[\s:：]*[¥￥]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /[¥￥](\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 0 && amount < 10000000) { // 妥当な範囲
        extracted.totalAmount = amount;
        break;
      }
    }
  }
  
  // 税率の推定
  if (text.includes('10%') || text.includes('10％')) {
    extracted.taxRate = 10;
  } else if (text.includes('8%') || text.includes('8％')) {
    extracted.taxRate = 8;
  } else if (text.includes('0%') || text.includes('0％') || text.includes('非課税')) {
    extracted.taxRate = 0;
  } else {
    extracted.taxRate = 10; // デフォルト
  }
  
  // 適格区分の推定
  const qualifiedKeywords = ['適格', 'qualified', 'invoice', 'receipt', '領収書', '請求書'];
  const notQualifiedKeywords = ['非適格', 'not qualified', 'not applicable'];
  
  const hasQualifiedKeywords = qualifiedKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  const hasNotQualifiedKeywords = notQualifiedKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (hasNotQualifiedKeywords) {
    extracted.isQualified = false;
  } else if (hasQualifiedKeywords) {
    extracted.isQualified = true;
  } else {
    extracted.isQualified = true; // デフォルト
  }
  
  return extracted;
}

export function validateOCRResult(result: OCRResult): string[] {
  const errors: string[] = [];
  
  if (!result.text || result.text.trim().length === 0) {
    errors.push('テキストが抽出されませんでした');
  }
  
  if (!result.date) {
    errors.push('日付が抽出されませんでした');
  }
  
  if (!result.totalAmount || result.totalAmount <= 0) {
    errors.push('有効な金額が抽出されませんでした');
  }
  
  return errors;
} 
