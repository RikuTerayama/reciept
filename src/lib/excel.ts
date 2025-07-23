import * as XLSX from 'xlsx';
import { ExpenseData } from '@/types';

export function exportExpensesToExcel(expenses: ExpenseData[], filename: string = 'expenses.xlsx') {
  // ワークブックを作成
  const workbook = XLSX.utils.book_new();

  // 経費データをワークシート用の形式に変換
  const worksheetData = expenses.map((expense, index) => ({
    'No.': index + 1,
    '日付': expense.date,
    '合計金額': expense.totalAmount,
    '税率': `${expense.taxRate}%`,
    '通貨': expense.currency,
    'カテゴリ': expense.category,
    '部署': expense.department,
    '適格区分': expense.isQualified,
    '作成日': expense.createdAt.toLocaleDateString('ja-JP'),
  }));

  // ワークシートを作成
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // 列幅を設定
  const columnWidths = [
    { wch: 5 },   // No.
    { wch: 12 },  // 日付
    { wch: 12 },  // 合計金額
    { wch: 8 },   // 税率
    { wch: 8 },   // 通貨
    { wch: 30 },  // カテゴリ
    { wch: 10 },  // 部署
    { wch: 25 },  // 適格区分
    { wch: 12 },  // 作成日
  ];
  worksheet['!cols'] = columnWidths;

  // ワークブックにワークシートを追加
  XLSX.utils.book_append_sheet(workbook, worksheet, '経費データ');

  // サマリーシートを作成
  createSummarySheet(workbook, expenses);

  // ファイルをダウンロード
  XLSX.writeFile(workbook, filename);
}

function createSummarySheet(workbook: XLSX.WorkBook, expenses: ExpenseData[]) {
  if (expenses.length === 0) return;

  // 基本統計
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const averageAmount = totalAmount / expenses.length;
  const minAmount = Math.min(...expenses.map(exp => exp.totalAmount));
  const maxAmount = Math.max(...expenses.map(exp => exp.totalAmount));

  const summaryData = [
    { '項目': '総件数', '値': expenses.length },
    { '項目': '総金額', '値': totalAmount },
    { '項目': '平均金額', '値': Math.round(averageAmount) },
    { '項目': '最小金額', '値': minAmount },
    { '項目': '最大金額', '値': maxAmount },
  ];

  // カテゴリ別集計
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown).map(([category, amount]) => ({
    'カテゴリ': category,
    '金額': amount,
    '割合': `${((amount / totalAmount) * 100).toFixed(1)}%`,
  }));

  // 部署別集計
  const departmentBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.department] = (acc[exp.department] || 0) + exp.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentBreakdown).map(([department, amount]) => ({
    '部署': department,
    '金額': amount,
    '割合': `${((amount / totalAmount) * 100).toFixed(1)}%`,
  }));

  // サマリーシートを作成
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'サマリー');

  // カテゴリ別集計シートを作成
  const categoryWorksheet = XLSX.utils.json_to_sheet(categoryData);
  categoryWorksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, categoryWorksheet, 'カテゴリ別集計');

  // 部署別集計シートを作成
  const departmentWorksheet = XLSX.utils.json_to_sheet(departmentData);
  departmentWorksheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, departmentWorksheet, '部署別集計');
}

export function exportOptimizedExpenseToExcel(
  optimizedExpense: { expenses: ExpenseData[]; totalAmount: number; difference: number },
  targetBudget: number,
  filename: string = 'optimized_expenses.xlsx'
) {
  const workbook = XLSX.utils.book_new();

  // 最適化された経費データ
  const worksheetData = optimizedExpense.expenses.map((expense, index) => ({
    'No.': index + 1,
    '日付': expense.date,
    '合計金額': expense.totalAmount,
    '税率': `${expense.taxRate}%`,
    '通貨': expense.currency,
    'カテゴリ': expense.category,
    '部署': expense.department,
    '適格区分': expense.isQualified,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 5 },   // No.
    { wch: 12 },  // 日付
    { wch: 12 },  // 合計金額
    { wch: 8 },   // 税率
    { wch: 8 },   // 通貨
    { wch: 30 },  // カテゴリ
    { wch: 10 },  // 部署
    { wch: 25 },  // 適格区分
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '最適化経費');

  // 最適化結果サマリー
  const summaryData = [
    { '項目': '目標予算', '値': targetBudget },
    { '項目': '選択された経費数', '値': optimizedExpense.expenses.length },
    { '項目': '合計金額', '値': optimizedExpense.totalAmount },
    { '項目': '予算との差額', '値': optimizedExpense.difference },
    { '項目': '予算使用率', '値': `${((optimizedExpense.totalAmount / targetBudget) * 100).toFixed(1)}%` },
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '最適化結果');

  XLSX.writeFile(workbook, filename);
} 
