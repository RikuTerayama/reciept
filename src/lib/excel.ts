import * as XLSX from 'xlsx';
import { ExpenseData } from '@/types';

export function exportExpensesToExcel(expenses: ExpenseData[], filename: string = 'expenses.xlsx') {
  try {
    // データをExcel用に変換（添付画像の順序に合わせて調整）
    const excelData = expenses.map(expense => ({
      'Receipt #': expense.id,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.ocrText || '',
      'Recharged to client?': 'No', // デフォルト値
      'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
      'Tax Rate (%)': expense.taxRate,
      'Company Nar': expense.department, // Company Nameの代わりに部署を使用
      '# Participant from client': 1, // デフォルト値
      '# Participant from company': 1, // デフォルト値
      'Division': expense.department,
      'Tax Credit Q': expense.isQualified.includes('Qualified') ? 'Yes' : 'No'
    }));

    // ワークブックとワークシートを作成
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 列幅の自動調整（添付画像の順序に合わせて）
    const columnWidths = [
      { wch: 12 }, // Receipt #
      { wch: 12 }, // Receipt Date
      { wch: 25 }, // Total Amount (Inclusive GST/VAT)
      { wch: 8 },  // Currency
      { wch: 30 }, // Category
      { wch: 40 }, // Description
      { wch: 15 }, // Recharged to client?
      { wch: 15 }, // GST/VAT applicable
      { wch: 12 }, // Tax Rate (%)
      { wch: 15 }, // Company Nar
      { wch: 20 }, // # Participant from client
      { wch: 20 }, // # Participant from company
      { wch: 15 }, // Division
      { wch: 12 }  // Tax Credit Q
    ];
    worksheet['!cols'] = columnWidths;

    // ワークシートをワークブックに追加
    XLSX.utils.book_append_sheet(workbook, worksheet, '経費データ');

    // ファイルをダウンロード
    XLSX.writeFile(workbook, filename);

    console.log(`Excel file exported: ${filename}`);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excelファイルのエクスポートに失敗しました');
  }
}

export function exportBudgetOptimizationToExcel(
  originalExpenses: ExpenseData[],
  optimizedExpenses: ExpenseData[],
  targetBudget: number,
  filename: string = 'budget_optimization.xlsx'
) {
  try {
    const workbook = XLSX.utils.book_new();

    // 元の経費データ（添付画像の順序に合わせて）
    const originalData = originalExpenses.map(expense => ({
      'Receipt #': expense.id,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.ocrText || '',
      'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
      'Tax Rate (%)': expense.taxRate,
      'Company Nar': expense.department,
      'Division': expense.department,
      'Tax Credit Q': expense.isQualified.includes('Qualified') ? 'Yes' : 'No'
    }));

    const originalWorksheet = XLSX.utils.json_to_sheet(originalData);
    XLSX.utils.book_append_sheet(workbook, originalWorksheet, '全経費データ');

    // 最適化された経費データ（添付画像の順序に合わせて）
    const optimizedData = optimizedExpenses.map(expense => ({
      'Receipt #': expense.id,
      'Receipt Date': expense.date,
      'Total Amount (Inclusive GST/VAT)': expense.totalAmount,
      'Currency': expense.currency,
      'Category': expense.category,
      'Description': expense.ocrText || '',
      'GST/VAT applicable': expense.taxRate > 0 ? 'Yes' : 'No',
      'Tax Rate (%)': expense.taxRate,
      'Company Nar': expense.department,
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
