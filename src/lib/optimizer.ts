import { ExpenseData, OptimizedExpense } from '@/types';

export function findOptimalExpenseCombination(
  expenses: ExpenseData[],
  targetBudget: number
): OptimizedExpense | null {
  if (expenses.length === 0) return null;

  // 動的計画法を使用して最適な組み合わせを見つける
  const dp: boolean[][] = Array(expenses.length + 1)
    .fill(null)
    .map(() => Array(targetBudget + 1).fill(false));

  // 初期化
  dp[0][0] = true;

  // 動的計画法の実行
  for (let i = 1; i <= expenses.length; i++) {
    for (let j = 0; j <= targetBudget; j++) {
      dp[i][j] = dp[i - 1][j];
      if (j >= expenses[i - 1].totalAmount) {
        dp[i][j] = dp[i][j] || dp[i - 1][j - expenses[i - 1].totalAmount];
      }
    }
  }

  // 最適な組み合わせを復元
  let bestSum = 0;
  for (let j = targetBudget; j >= 0; j--) {
    if (dp[expenses.length][j]) {
      bestSum = j;
      break;
    }
  }

  if (bestSum === 0) return null;

  // 選択された経費を復元
  const selectedExpenses: ExpenseData[] = [];
  let remainingSum = bestSum;
  
  for (let i = expenses.length; i > 0 && remainingSum > 0; i--) {
    if (remainingSum >= expenses[i - 1].totalAmount && dp[i - 1][remainingSum - expenses[i - 1].totalAmount]) {
      selectedExpenses.unshift(expenses[i - 1]);
      remainingSum -= expenses[i - 1].totalAmount;
    }
  }

  return {
    expenses: selectedExpenses,
    totalAmount: bestSum,
    difference: targetBudget - bestSum,
  };
}

export function findMultipleOptimalCombinations(
  expenses: ExpenseData[],
  targetBudget: number,
  maxCombinations: number = 3
): OptimizedExpense[] {
  const combinations: OptimizedExpense[] = [];
  
  // 全ての可能な組み合わせを生成（小規模な場合のみ）
  if (expenses.length <= 20) {
    const allCombinations = generateAllCombinations(expenses);
    
    // 予算内の組み合わせをフィルタリング
    const validCombinations = allCombinations
      .map(combo => ({
        expenses: combo,
        totalAmount: combo.reduce((sum, exp) => sum + exp.totalAmount, 0),
        difference: 0
      }))
      .filter(combo => combo.totalAmount <= targetBudget)
      .map(combo => ({
        ...combo,
        difference: targetBudget - combo.totalAmount
      }))
      .sort((a, b) => a.difference - b.difference);

    return validCombinations.slice(0, maxCombinations);
  }

  // 大規模な場合は動的計画法を使用
  const optimal = findOptimalExpenseCombination(expenses, targetBudget);
  if (optimal) {
    combinations.push(optimal);
  }

  return combinations;
}

function generateAllCombinations(expenses: ExpenseData[]): ExpenseData[][] {
  const combinations: ExpenseData[][] = [];
  
  function backtrack(start: number, current: ExpenseData[]) {
    combinations.push([...current]);
    
    for (let i = start; i < expenses.length; i++) {
      current.push(expenses[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return combinations;
}

export function calculateExpenseStatistics(expenses: ExpenseData[]) {
  if (expenses.length === 0) {
    return {
      totalAmount: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      categoryBreakdown: {},
      departmentBreakdown: {},
    };
  }

  const amounts = expenses.map(exp => exp.totalAmount);
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
  
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const departmentBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.department] = (acc[exp.department] || 0) + exp.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAmount,
    averageAmount: totalAmount / expenses.length,
    minAmount: Math.min(...amounts),
    maxAmount: Math.max(...amounts),
    categoryBreakdown,
    departmentBreakdown,
  };
} 
