'use client';

import React from 'react';
import { BarChart3, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { ExpenseData } from '@/types';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

interface MobileStatisticsProps {
  expenses: ExpenseData[];
  userInfo: UserInfo;
}

export default function MobileStatistics({ expenses, userInfo }: MobileStatisticsProps) {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const budgetDifference = userInfo.budget - totalAmount;
  const isOverBudget = budgetDifference < 0;

  return (
    <div className="lg:hidden">
      <div className="card animate-fade-in">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">統計情報</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4">
            {/* 予算額 */}
            <div className="stat-card">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary-400" />
                <span className="text-xs text-gray-300">予算</span>
              </div>
              <div className="stat-number text-lg">¥{userInfo.budget.toLocaleString()}</div>
            </div>

            {/* 登録済み経費数 */}
            <div className="stat-card">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-secondary-400" />
                <span className="text-xs text-gray-300">件数</span>
              </div>
              <div className="stat-number text-lg">{expenses.length}</div>
            </div>

            {/* 登録済み経費の総額 */}
            <div className="stat-card">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-300">総額</span>
              </div>
              <div className="stat-number text-lg">¥{totalAmount.toLocaleString()}</div>
            </div>

            {/* 予算との差分 */}
            <div className="stat-card">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${isOverBudget ? 'text-red-400' : 'text-green-400'}`} />
                <span className="text-xs text-gray-300">残額</span>
              </div>
              <div className={`stat-number text-lg ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                ¥{Math.abs(budgetDifference).toLocaleString()}
              </div>
              <div className={`text-xs ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                {isOverBudget ? '超過' : '余裕'}
              </div>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>予算使用率</span>
              <span>{Math.round((totalAmount / userInfo.budget) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverBudget ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((totalAmount / userInfo.budget) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
