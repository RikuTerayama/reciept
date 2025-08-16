import ExcelJS from 'exceljs';
import { ExpenseData } from '@/types';
import { downloadImagesAsZip, downloadMultipleImages } from './image-utils';

export const exportExpensesToExcel = async (expenses: ExpenseData[], filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('経費データ');
  
  // ヘッダーの設定
  worksheet.columns = [
    { header: 'Receipt #', key: 'receiptNumber', width: 10 },
    { header: 'Receipt Date', key: 'date', width: 12 },
    { header: 'Total Amount (Inclusive GST/VAT)', key: 'totalAmount', width: 25 },
    { header: 'Currency', key: 'currency', width: 8 },
    { header: 'Category', key: 'category', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Recharged to client?', key: 'rechargedToClient', width: 20 },
    { header: 'GST/VAT applicable', key: 'gstVatApplicable', width: 15 },
    { header: 'Tax Rate (%)', key: 'taxRate', width: 12 },
    { header: 'Company Name', key: 'companyName', width: 20 },
    { header: '# Participant from client', key: 'participantFromClient', width: 25 },
    { header: '# Participant from company', key: 'participantFromCompany', width: 25 },
    { header: 'Tax Credit Qualification', key: 'isQualified', width: 30 }
  ];

  // スタイル設定
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, name: 'Arial' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // データの追加
  expenses.forEach((expense, index) => {
    worksheet.addRow({
      receiptNumber: index + 1,
      date: expense.date,
      totalAmount: expense.totalAmount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description || '',
      rechargedToClient: expense.rechargedToClient || 'N',
      gstVatApplicable: expense.gstVatApplicable || 'N',
      taxRate: `${expense.taxRate}%`,
      companyName: expense.companyName || '',
      participantFromClient: expense.participantFromClient || '',
      participantFromCompany: expense.participantFromCompany || '',
      isQualified: expense.isQualified
    });
  });

  // データ行のスタイル設定
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.font = { name: 'Arial' };
  }

  // ファイルの保存
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

export async function exportBudgetOptimizationToExcel(
  originalExpenses: ExpenseData[],
  optimizedExpenses: ExpenseData[],
  targetBudget: number,
  filename: string = 'budget_optimization.xlsx'
) {
  try {
    const workbook = new ExcelJS.Workbook();

    // 1. 最適化結果シート
    const optimizedWorksheet = workbook.addWorksheet('最適化結果');
    optimizedWorksheet.columns = [
      { header: 'Receipt #', key: 'receiptNumber', width: 10 },
      { header: 'Receipt Date', key: 'date', width: 12 },
      { header: 'Total Amount (Inclusive GST/VAT)', key: 'totalAmount', width: 25 },
      { header: 'Currency', key: 'currency', width: 8 },
      { header: 'Category', key: 'category', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Recharged to client?', key: 'rechargedToClient', width: 20 },
      { header: 'GST/VAT applicable', key: 'gstVatApplicable', width: 15 },
      { header: 'Tax Rate (%)', key: 'taxRate', width: 12 },
      { header: 'Company Name', key: 'companyName', width: 20 },
      { header: '# Participant from client', key: 'participantFromClient', width: 25 },
      { header: '# Participant from company', key: 'participantFromCompany', width: 25 },
      { header: 'Tax Credit Qualification', key: 'isQualified', width: 30 }
    ];

    optimizedExpenses.forEach((expense, index) => {
      optimizedWorksheet.addRow({
        receiptNumber: index + 1,
        date: expense.date,
        totalAmount: expense.totalAmount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description || expense.ocrText || '',
        rechargedToClient: expense.rechargedToClient || 'N',
        gstVatApplicable: expense.gstVatApplicable || 'N',
        taxRate: `${expense.taxRate}%`,
        companyName: expense.companyName || '',
        participantFromClient: expense.participantFromClient || '',
        participantFromCompany: expense.participantFromCompany || '',
        isQualified: expense.isQualified
      });
    });

    // 2. サマリーシート
    const summaryWorksheet = workbook.addWorksheet('サマリー');
    summaryWorksheet.columns = [
      { header: '項目', key: 'item', width: 20 },
      { header: '値', key: 'value', width: 15 }
    ];

    const summaryData = [
      { item: '目標予算', value: targetBudget },
      { item: '最適化後の合計', value: optimizedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0) },
      { item: '差額', value: targetBudget - optimizedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0) },
      { item: '選択された経費数', value: optimizedExpenses.length }
    ];

    summaryData.forEach(row => {
      summaryWorksheet.addRow(row);
    });

    // 3. 全経費データシート
    const originalWorksheet = workbook.addWorksheet('全経費データ');
    originalWorksheet.columns = [
      { header: 'Receipt #', key: 'receiptNumber', width: 10 },
      { header: 'Receipt Date', key: 'date', width: 12 },
      { header: 'Total Amount (Inclusive GST/VAT)', key: 'totalAmount', width: 25 },
      { header: 'Currency', key: 'currency', width: 8 },
      { header: 'Category', key: 'category', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Recharged to client?', key: 'rechargedToClient', width: 20 },
      { header: 'GST/VAT applicable', key: 'gstVatApplicable', width: 15 },
      { header: 'Tax Rate (%)', key: 'taxRate', width: 12 },
      { header: 'Company Name', key: 'companyName', width: 20 },
      { header: '# Participant from client', key: 'participantFromClient', width: 25 },
      { header: '# Participant from company', key: 'participantFromCompany', width: 25 },
      { header: 'Tax Credit Qualification', key: 'isQualified', width: 30 }
    ];

    originalExpenses.forEach((expense, index) => {
      originalWorksheet.addRow({
        receiptNumber: index + 1,
        date: expense.date,
        totalAmount: expense.totalAmount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description || expense.ocrText || '',
        rechargedToClient: expense.rechargedToClient || 'N',
        gstVatApplicable: expense.gstVatApplicable || 'N',
        taxRate: `${expense.taxRate}%`,
        companyName: expense.companyName || '',
        participantFromClient: expense.participantFromClient || '',
        participantFromCompany: expense.participantFromCompany || '',
        isQualified: expense.isQualified
      });
    });

    // スタイル設定
    [optimizedWorksheet, summaryWorksheet, originalWorksheet].forEach(worksheet => {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, name: 'Arial' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    // ファイルの保存
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Budget optimization Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Budget optimization Excel export error:', error);
    throw new Error('予算最適化のExcelエクスポートに失敗しました');
  }
} 
