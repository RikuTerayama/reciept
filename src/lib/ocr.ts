import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';

export async function extractTextFromImage(file: File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(file, 'jpn+eng', {
      logger: m => console.log(m)
    });

    const text = result.data.text;
    console.log('Extracted text:', text);
    
    // 基本的な情報抽出（改善版）
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
  
  // 日付の抽出（改善版）
  const datePatterns = [
    /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/,
    /(\d{1,2})[月\/\-](\d{1,2})[日\/\-](\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/
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
  
  // 金額の抽出（大幅改善版）
  const amountPatterns = [
    // 合計金額のパターン（優先度高い）
    /(?:合計|総額|TOTAL|AMOUNT|合計金額|総計)[\s:：]*[¥￥]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:合計|総額|TOTAL|AMOUNT|合計金額|総計)[\s:：]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/i,
    /[¥￥](\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/,
    // 小計のパターン（合計が見つからない場合）
    /(?:小計|SUBTOTAL|小計金額)[\s:：]*[¥￥]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:小計|SUBTOTAL|小計金額)[\s:：]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/i,
    // 一般的な金額パターン
    /(?:金額|AMOUNT|PRICE)[\s:：]*[¥￥]?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:金額|AMOUNT|PRICE)[\s:：]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/i,
    // 数字のみのパターン（最後の手段）
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[円]/
  ];
  
  let foundAmount = false;
  for (const pattern of amountPatterns) {
    const matches = text.match(new RegExp(pattern, 'gi'));
    if (matches && matches.length > 0) {
      // 最後のマッチを取得（通常、合計金額は最後に記載される）
      const lastMatch = matches[matches.length - 1];
      const amountMatch = lastMatch.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
      if (amountMatch) {
        const amount = parseInt(amountMatch[1].replace(/,/g, ''));
        if (amount > 0 && amount < 10000000) { // 妥当な範囲
          extracted.totalAmount = amount;
          foundAmount = true;
          console.log(`Found amount: ${amount} from pattern: ${pattern}`);
          break;
        }
      }
    }
  }
  
  // 金額が見つからない場合のデバッグ情報
  if (!foundAmount) {
    console.log('No amount found in text. Available numbers:', text.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g));
  }
  
  // 税率の推定（改善版）
  if (text.includes('10%') || text.includes('10％') || text.includes('10.0%')) {
    extracted.taxRate = 10;
  } else if (text.includes('8%') || text.includes('8％') || text.includes('8.0%')) {
    extracted.taxRate = 8;
  } else if (text.includes('0%') || text.includes('0％') || text.includes('非課税') || text.includes('免税')) {
    extracted.taxRate = 0;
  } else {
    extracted.taxRate = 10; // デフォルト
  }
  
  // 適格区分の推定（改善版）
  const qualifiedKeywords = ['適格', 'qualified', 'invoice', 'receipt', '領収書', '請求書', 'tax invoice'];
  const notQualifiedKeywords = ['非適格', 'not qualified', 'not applicable', 'personal'];
  
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
