import * as XLSX from 'xlsx';
import { ExpenseData } from '@/types';

export function exportExpensesToExcel(expenses: ExpenseData[], filename: string = 'expenses.xlsx') {
  try {
    // データをExcel用に変換
    const excelData = expenses.map(expense => ({
      '日付': expense.date,
      '合計金額': expense.totalAmount,
      '税率': `${expense.taxRate}%`,
      '通貨': expense.currency,
      'カテゴリ': expense.category,
      '部署': expense.department,
      '適格区分': expense.isQualified,
      '作成日時': expense.createdAt.toLocaleString('ja-JP'),
      'OCRテキスト': expense.ocrText || ''
    }));

    // ワークブックとワークシートを作成
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 列幅の自動調整
    const columnWidths = [
      { wch: 12 }, // 日付
      { wch: 12 }, // 合計金額
      { wch: 8 },  // 税率
      { wch: 6 },  // 通貨
      { wch: 30 }, // カテゴリ
      { wch: 10 }, // 部署
      { wch: 25 }, // 適格区分
      { wch: 20 }, // 作成日時
      { wch: 50 }  // OCRテキスト
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

    // 元の経費データ
    const originalData = originalExpenses.map(expense => ({
      '日付': expense.date,
      '合計金額': expense.totalAmount,
      'カテゴリ': expense.category,
      '部署': expense.department,
      '適格区分': expense.isQualified
    }));

    const originalWorksheet = XLSX.utils.json_to_sheet(originalData);
    XLSX.utils.book_append_sheet(workbook, originalWorksheet, '全経費データ');

    // 最適化された経費データ
    const optimizedData = optimizedExpenses.map(expense => ({
      '日付': expense.date,
      '合計金額': expense.totalAmount,
      'カテゴリ': expense.category,
      '部署': expense.department,
      '適格区分': expense.isQualified
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
