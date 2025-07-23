import { ExpenseData, OptimizedExpense } from '@/types';

// 動的計画法を使用した予算最適化アルゴリズム
export function findOptimalExpenseCombination(
  expenses: ExpenseData[],
  targetBudget: number
): OptimizedExpense {
  if (expenses.length === 0 || targetBudget <= 0) {
    return {
      expenses: [],
      totalAmount: 0,
      difference: targetBudget
    };
  }

  // 経費を金額でソート（降順）
  const sortedExpenses = [...expenses].sort((a, b) => b.totalAmount - a.totalAmount);
  
  // 動的計画法のテーブル
  const dp: number[][] = Array(expenses.length + 1)
    .fill(null)
    .map(() => Array(targetBudget + 1).fill(0));
  
  // 選択された経費を追跡するテーブル
  const selected: boolean[][] = Array(expenses.length + 1)
    .fill(null)
    .map(() => Array(targetBudget + 1).fill(false));

  // 動的計画法で最適解を計算
  for (let i = 1; i <= expenses.length; i++) {
    const expense = sortedExpenses[i - 1];
    
    for (let budget = 0; budget <= targetBudget; budget++) {
      // 現在の経費を選択しない場合
      dp[i][budget] = dp[i - 1][budget];
      
      // 現在の経費を選択できる場合
      if (expense.totalAmount <= budget) {
        const valueWithCurrent = dp[i - 1][budget - expense.totalAmount] + expense.totalAmount;
        
        if (valueWithCurrent > dp[i][budget]) {
          dp[i][budget] = valueWithCurrent;
          selected[i][budget] = true;
        }
      }
    }
  }

  // 最適解を復元
  const selectedExpenses: ExpenseData[] = [];
  let currentBudget = targetBudget;
  
  for (let i = expenses.length; i > 0; i--) {
    if (selected[i][currentBudget]) {
      const expense = sortedExpenses[i - 1];
      selectedExpenses.push(expense);
      currentBudget -= expense.totalAmount;
    }
  }

  const totalAmount = selectedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const difference = targetBudget - totalAmount;

  return {
    expenses: selectedExpenses,
    totalAmount,
    difference
  };
}

// 貪欲法を使用した簡易最適化（高速だが最適解ではない）
export function findGreedyExpenseCombination(
  expenses: ExpenseData[],
  targetBudget: number
): OptimizedExpense {
  if (expenses.length === 0 || targetBudget <= 0) {
    return {
      expenses: [],
      totalAmount: 0,
      difference: targetBudget
    };
  }

  // 金額で降順ソート
  const sortedExpenses = [...expenses].sort((a, b) => b.totalAmount - a.totalAmount);
  
  const selectedExpenses: ExpenseData[] = [];
  let currentTotal = 0;

  for (const expense of sortedExpenses) {
    if (currentTotal + expense.totalAmount <= targetBudget) {
      selectedExpenses.push(expense);
      currentTotal += expense.totalAmount;
    }
  }

  return {
    expenses: selectedExpenses,
    totalAmount: currentTotal,
    difference: targetBudget - currentTotal
  };
}

// 複数の最適化戦略を比較
export function compareOptimizationStrategies(
  expenses: ExpenseData[],
  targetBudget: number
): {
  dynamic: OptimizedExpense;
  greedy: OptimizedExpense;
  comparison: {
    dynamicBetter: boolean;
    improvement: number;
    improvementPercentage: number;
  };
} {
  const dynamicResult = findOptimalExpenseCombination(expenses, targetBudget);
  const greedyResult = findGreedyExpenseCombination(expenses, targetBudget);

  const improvement = dynamicResult.totalAmount - greedyResult.totalAmount;
  const improvementPercentage = greedyResult.totalAmount > 0 
    ? (improvement / greedyResult.totalAmount) * 100 
    : 0;

  return {
    dynamic: dynamicResult,
    greedy: greedyResult,
    comparison: {
      dynamicBetter: dynamicResult.totalAmount > greedyResult.totalAmount,
      improvement,
      improvementPercentage
    }
  };
}

// 予算範囲での最適化（複数の予算でテスト）
export function findOptimalBudgetRange(
  expenses: ExpenseData[],
  minBudget: number,
  maxBudget: number,
  step: number = 10000
): Array<{ budget: number; result: OptimizedExpense }> {
  const results: Array<{ budget: number; result: OptimizedExpense }> = [];
  
  for (let budget = minBudget; budget <= maxBudget; budget += step) {
    const result = findOptimalExpenseCombination(expenses, budget);
    results.push({ budget, result });
  }
  
  return results;
}

// 効率性指標の計算
export function calculateEfficiencyMetrics(
  expenses: ExpenseData[],
  optimizedResult: OptimizedExpense,
  targetBudget: number
): {
  budgetUtilization: number;
  averageValue: number;
  selectionEfficiency: number;
  costEffectiveness: number;
} {
  const budgetUtilization = (optimizedResult.totalAmount / targetBudget) * 100;
  const averageValue = optimizedResult.expenses.length > 0 
    ? optimizedResult.totalAmount / optimizedResult.expenses.length 
    : 0;
  const selectionEfficiency = (optimizedResult.expenses.length / expenses.length) * 100;
  const costEffectiveness = optimizedResult.difference >= 0 ? 100 : 
    Math.max(0, 100 + (optimizedResult.difference / targetBudget) * 100);

  return {
    budgetUtilization,
    averageValue,
    selectionEfficiency,
    costEffectiveness
  };
} 
