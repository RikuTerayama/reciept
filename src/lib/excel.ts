import * as XLSX from 'xlsx';
import { ExpenseData } from '@/types';
import { downloadImagesAsZip, downloadMultipleImages } from './image-utils';

export const exportExpensesToExcel = (expenses: ExpenseData[], filename: string) => {
  const workbook = XLSX.utils.book_new();
  const data = expenses.map((expense, index) => ({
    'Receipt #': index + 1,
    'Receipt Date': expense.date,
    'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
    'Currency': expense.currency,
    'Category': expense.category,
    'Description': expense.description || '',
    'Recharged to client?': expense.rechargedToClient || 'N',
    'GST/VAT applicable': expense.gstVatApplicable || 'N',
    'Tax Rate (%)': `${expense.taxRate}%`,
    'Company Name': expense.companyName || '',
    '# Participant from client': expense.participantFromClient || '',
    '# Participant from company': expense.participantFromCompany || '',
    'Tax Credit Qualification': expense.isQualified
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // 列幅の設定
  const columnWidths = [
    { wch: 10 }, // Receipt #
    { wch: 12 }, // Receipt Date
    { wch: 25 }, // Total Amount (Inclusive GST/VAT)
    { wch: 8 },  // Currency
    { wch: 40 }, // Category
    { wch: 50 }, // Description
    { wch: 20 }, // Recharged to client?
    { wch: 15 }, // GST/VAT applicable
    { wch: 12 }, // Tax Rate (%)
    { wch: 20 }, // Company Name
    { wch: 25 }, // # Participant from client
    { wch: 25 }, // # Participant from company
    { wch: 30 }, // Tax Credit Qualification
  ];
  worksheet['!cols'] = columnWidths;
  
  // フォント設定（XLSXユーティリティが利用できない場合のフォールバック）
  try {
    if ((XLSX.utils as any).decode_range && (XLSX.utils as any).encode_cell) {
      const range = (XLSX.utils as any).decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = (XLSX.utils as any).encode_cell({ r: R, c: C });
          if (!worksheet[cell_address]) continue;
          worksheet[cell_address].s = { font: { name: 'Arial' } };
        }
      }
    }
  } catch (error) {
    console.warn('XLSXフォント設定をスキップしました:', error);
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, '経費データ');
  XLSX.writeFile(workbook, filename);
};

// 選択された経費の画像を一括ダウンロード
export const downloadSelectedReceiptImages = async (expenses: ExpenseData[], selectedIds: string[]) => {
  const selectedExpenses = expenses.filter(expense => selectedIds.includes(expense.id));
  
  // 画像データがある経費のみをフィルタリング
  const expensesWithImages = selectedExpenses.filter(expense => expense.imageData);
  
  if (expensesWithImages.length === 0) {
    alert('ダウンロード可能な画像がありません。');
    return;
  }

  // 画像データとファイル名を準備
  const images = expensesWithImages.map(expense => ({
    base64: expense.imageData!,
    filename: `${expense.receiptNumber || expense.id}_${expense.date}.jpg`
  }));

  try {
    // ZIPファイルとしてダウンロード
    await downloadImagesAsZip(images);
  } catch (error) {
    console.error('ZIPダウンロードエラー:', error);
    // フォールバック: 個別ダウンロード
    await downloadMultipleImages(images);
  }
};

// 全経費の画像を一括ダウンロード
export const downloadAllReceiptImages = async (expenses: ExpenseData[]) => {
  // 画像データがある経費のみをフィルタリング
  const expensesWithImages = expenses.filter(expense => expense.imageData);
  
  if (expensesWithImages.length === 0) {
    alert('ダウンロード可能な画像がありません。');
    return;
  }

  // 画像データとファイル名を準備
  const images = expensesWithImages.map(expense => ({
    base64: expense.imageData!,
    filename: `${expense.receiptNumber || expense.id}_${expense.date}.jpg`
  }));

  try {
    // ZIPファイルとしてダウンロード
    await downloadImagesAsZip(images);
  } catch (error) {
    console.error('ZIPダウンロードエラー:', error);
    // フォールバック: 個別ダウンロード
    await downloadMultipleImages(images);
  }
};

// 月別の画像を一括ダウンロード
export const downloadMonthlyReceiptImages = async (expenses: ExpenseData[], year: number, month: number) => {
  const monthStr = month < 10 ? `0${month}` : month.toString();
  const yearMonth = `${year}-${monthStr}`;
  
  // 指定月の経費のみをフィルタリング
  const monthlyExpenses = expenses.filter(expense => 
    expense.date.startsWith(yearMonth) && expense.imageData
  );
  
  if (monthlyExpenses.length === 0) {
    alert(`${year}年${month}月のダウンロード可能な画像がありません。`);
    return;
  }

  // 画像データとファイル名を準備
  const images = monthlyExpenses.map(expense => ({
    base64: expense.imageData!,
    filename: `${expense.receiptNumber || expense.id}_${expense.date}.jpg`
  }));

  try {
    // ZIPファイルとしてダウンロード
    await downloadImagesAsZip(images);
  } catch (error) {
    console.error('ZIPダウンロードエラー:', error);
    // フォールバック: 個別ダウンロード
    await downloadMultipleImages(images);
  }
};

export function exportBudgetOptimizationToExcel(
  originalExpenses: ExpenseData[],
  optimizedExpenses: ExpenseData[],
  targetBudget: number,
  filename: string = 'budget_optimization.xlsx'
) {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. 最適化結果シート
    const optimizedData = optimizedExpenses.map((expense, index) => ({
      'Receipt #': index + 1,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.description || expense.ocrText || '',
      'Recharged to client?': expense.rechargedToClient || 'N',
      'GST/VAT applicable': expense.gstVatApplicable || 'N',
      'Tax Rate (%)': `${expense.taxRate}%`,
      'Company Name': expense.companyName || '',
      '# Participant from client': expense.participantFromClient || '',
      '# Participant from company': expense.participantFromCompany || '',
      'Tax Credit Qualification': expense.isQualified
    }));

    const optimizedWorksheet = XLSX.utils.json_to_sheet(optimizedData);
    setWorksheetFont(optimizedWorksheet, 'Arial');
    XLSX.utils.book_append_sheet(workbook, optimizedWorksheet, '最適化結果');

    // 2. サマリーシート
    const summaryData = [
      {
        '項目': '目標予算',
        '値': targetBudget
      },
      {
        '項目': '最適化後の合計',
        '値': optimizedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0)
      },
      {
        '項目': '差額',
        '値': targetBudget - optimizedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0)
      },
      {
        '項目': '選択された経費数',
        '値': optimizedExpenses.length
      }
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    setWorksheetFont(summaryWorksheet, 'Arial');
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'サマリー');

    // 3. 全経費データシート
    const originalData = originalExpenses.map((expense, index) => ({
      'Receipt #': index + 1,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.description || expense.ocrText || '',
      'Recharged to client?': expense.rechargedToClient || 'N',
      'GST/VAT applicable': expense.gstVatApplicable || 'N',
      'Tax Rate (%)': `${expense.taxRate}%`,
      'Company Name': expense.companyName || '',
      '# Participant from client': expense.participantFromClient || '',
      '# Participant from company': expense.participantFromCompany || '',
      'Tax Credit Qualification': expense.isQualified
    }));

    const originalWorksheet = XLSX.utils.json_to_sheet(originalData);
    setWorksheetFont(originalWorksheet, 'Arial');
    XLSX.utils.book_append_sheet(workbook, originalWorksheet, '全経費データ');

    // ファイルをダウンロード
    XLSX.writeFile(workbook, filename);

    console.log(`Budget optimization Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Budget optimization Excel export error:', error);
    throw new Error('予算最適化のExcelエクスポートに失敗しました');
  }
}

// ワークシートのフォントを設定するヘルパー関数
function setWorksheetFont(worksheet: XLSX.WorkSheet, fontName: string) {
  try {
    if ((XLSX.utils as any).decode_range && (XLSX.utils as any).encode_cell) {
      const range = (XLSX.utils as any).decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = (XLSX.utils as any).encode_cell({ r: R, c: C });
          if (!worksheet[cell_address]) continue;
          worksheet[cell_address].s = { font: { name: fontName } };
        }
      }
    }
  } catch (error) {
    console.warn('XLSXフォント設定をスキップしました:', error);
  }
} 
