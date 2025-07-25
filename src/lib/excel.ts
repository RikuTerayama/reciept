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
    'Recharged to client?': '', // 新しいフィールド（現在は空）
    'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
    'Tax Rate (%)': expense.taxRate,
    'Company Nar': expense.department,
    '# Participant from client': expense.participantFromClient || '',
    '# Participant from company': expense.participantFromCompany || '',
    'Division': expense.department,
    'Tax Credit Q': expense.isQualified.includes('Qualified') ? 'Yes' : 'No'
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
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
    { wch: 15 }, // Company Nar
    { wch: 25 }, // # Participant from client
    { wch: 25 }, // # Participant from company
    { wch: 15 }, // Division
    { wch: 15 }, // Tax Credit Q
  ];
  worksheet['!cols'] = columnWidths;
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

    // 元の経費データ（添付画像の順序に合わせて）
    const originalData = originalExpenses.map((expense, index) => ({
      'Receipt #': index + 1,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.description || expense.ocrText || '',
      'Recharged to client?': '', // 新しいフィールド（現在は空）
      'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
      'Tax Rate (%)': expense.taxRate,
      'Company Nar': expense.department,
      '# Participant from client': expense.participantFromClient || '',
      '# Participant from company': expense.participantFromCompany || '',
      'Division': expense.department,
      'Tax Credit Q': expense.isQualified.includes('Qualified') ? 'Yes' : 'No'
    }));

    const originalWorksheet = XLSX.utils.json_to_sheet(originalData);
    XLSX.utils.book_append_sheet(workbook, originalWorksheet, '全経費データ');

    // 最適化された経費データ（添付画像の順序に合わせて）
    const optimizedData = optimizedExpenses.map((expense, index) => ({
      'Receipt #': index + 1,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.description || expense.ocrText || '',
      'Recharged to client?': '', // 新しいフィールド（現在は空）
      'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
      'Tax Rate (%)': expense.taxRate,
      'Company Nar': expense.department,
      '# Participant from client': expense.participantFromClient || '',
      '# Participant from company': expense.participantFromCompany || '',
      'Division': expense.department,
      'Tax Credit Q': expense.isQualified.includes('Qualified') ? 'Yes' : 'No'
    }));

    const optimizedWorksheet = XLSX.utils.json_to_sheet(optimizedData);
    XLSX.utils.book_append_sheet(workbook, optimizedWorksheet, '最適化結果');

    // サマリーシート
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
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'サマリー');

    // ファイルをダウンロード
    XLSX.writeFile(workbook, filename);

    console.log(`Budget optimization Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Budget optimization Excel export error:', error);
    throw new Error('予算最適化のExcelエクスポートに失敗しました');
  }
} 
