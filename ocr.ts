import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types';

export async function extractTextFromImage(imageFile: File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageFile, 'jpn+eng', {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    console.log('Extracted text:', text);

    // 日付の抽出（YYYY-MM-DD形式）
    const dateMatch = text.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}` : undefined;

    // 金額の抽出
    const amountMatches = text.match(/(?:合計|総額|TOTAL|AMOUNT|¥|￥|\\|$)\s*([0-9,]+)/gi);
    let totalAmount: number | undefined;
    
    if (amountMatches) {
      // 最後の金額を取得（通常、合計金額は最後に記載される）
      const lastAmount = amountMatches[amountMatches.length - 1];
      const amountValue = lastAmount.replace(/[^\d,]/g, '').replace(/,/g, '');
      totalAmount = parseInt(amountValue, 10);
    }

    // 税率の抽出
    const taxRateMatch = text.match(/(?:税率|TAX RATE|消費税)\s*(\d+)%/);
    const taxRate = taxRateMatch ? parseInt(taxRateMatch[1], 10) : undefined;

    // 適格請求書の判定（Tから始まる番号の有無）
    const qualifiedMatch = text.match(/T\d+/);
    const isQualified = !!qualifiedMatch;

    return {
      date,
      totalAmount,
      taxRate,
      isQualified,
      text,
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('画像の処理中にエラーが発生しました');
  }
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
    errors.push('有効な金額が抽出できませんでした');
  }

  return errors;
} 