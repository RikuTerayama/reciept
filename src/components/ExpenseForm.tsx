'use client';

import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Calculator, AlertCircle, CheckCircle, DollarSign, Calendar, Percent, Building, FileText, User, Users } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { CURRENCIES, EXPENSE_CATEGORIES, TAX_RATES, DEPARTMENTS, QUALIFICATION_TYPES, ExpenseData } from '@/types';

interface UserInfo {
  email: string;
  targetMonth: string;
  department: string;
  budget: number;
}

export default function ExpenseForm() {
  const { ocrResult, addExpense, setOCRResult } = useExpenseStore();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const [formData, setFormData] = useState<Partial<ExpenseData>>({
    date: '',
    totalAmount: 0,
    taxRate: 10,
    currency: 'JPY',
    category: '',
    department: '',
    isQualified: 'Not Qualified',
    ocrText: '',
    description: '',
    participantFromClient: '',
    participantFromCompany: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ユーザー情報を読み込み
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try {
        const parsed = JSON.parse(savedUserInfo);
        setUserInfo(parsed);
        // ユーザー設定から通貨と組織を設定
        setFormData(prev => ({
          ...prev,
          currency: 'JPY', // デフォルトはJPY
          department: parsed.department
        }));
      } catch (error) {
        console.error('Failed to parse saved user info:', error);
      }
    }
  }, []);

  // OCR結果がある場合、フォームに自動入力
  useEffect(() => {
    if (ocrResult) {
      setFormData(prev => ({
        ...prev,
        date: ocrResult.date || '',
        totalAmount: ocrResult.totalAmount || 0,
        taxRate: ocrResult.taxRate || 10,
        isQualified: ocrResult.isQualified ? 'Qualified invoice/receipt' : 'Not Qualified',
        ocrText: ocrResult.text
      }));
    }
  }, [ocrResult]);

  // 金額の自動計算
  const calculateTotal = (baseAmount: number, taxRate: number): number => {
    return Math.round(baseAmount * (1 + taxRate / 100));
  };

  // 税抜き金額から税込み金額を計算
  const calculateTotalFromBase = (baseAmount: number, taxRate: number): number => {
    return calculateTotal(baseAmount, taxRate);
  };

  // 税込み金額から税抜き金額を計算
  const calculateBaseFromTotal = (totalAmount: number, taxRate: number): number => {
    return Math.round(totalAmount / (1 + taxRate / 100));
  };

  // 金額フィールドの変更処理
  const handleAmountChange = (field: 'baseAmount' | 'totalAmount', value: string) => {
    // 先頭のゼロを削除
    const cleanValue = value.replace(/^0+/, '') || '0';
    const numValue = parseFloat(cleanValue) || 0;
    const taxRate = formData.taxRate || 10;
    
    setIsCalculating(true);
    
    if (field === 'baseAmount') {
      const total = calculateTotalFromBase(numValue, taxRate);
      setFormData(prev => ({
        ...prev,
        totalAmount: total
      }));
    } else {
      const base = calculateBaseFromTotal(numValue, taxRate);
      setFormData(prev => ({
        ...prev,
        totalAmount: numValue
      }));
    }
    
    // 計算中の表示を少し遅延させる
    setTimeout(() => setIsCalculating(false), 300);
  };

  // 税率変更時の自動再計算
  const handleTaxRateChange = (taxRate: number) => {
    const currentTotal = formData.totalAmount || 0;
    const baseAmount = calculateBaseFromTotal(currentTotal, formData.taxRate || 10);
    const newTotal = calculateTotalFromBase(baseAmount, taxRate);
    
    setFormData(prev => ({
      ...prev,
      taxRate,
      totalAmount: newTotal
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = '日付は必須です';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = '日付はYYYY-MM-DD形式で入力してください';
      }
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = '合計金額は0より大きい値を入力してください';
    }

    if (!formData.category) {
      newErrors.category = '経費カテゴリは必須です';
    }

    if (!formData.department) {
      newErrors.department = '所属組織は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newExpense: ExpenseData = {
      id: Date.now().toString(),
      date: formData.date!,
      totalAmount: formData.totalAmount!,
      taxRate: formData.taxRate!,
      currency: formData.currency!,
      category: formData.category!,
      department: formData.department!,
      isQualified: formData.isQualified!,
      ocrText: formData.ocrText,
      description: formData.description || '',
      participantFromClient: formData.participantFromClient || '',
      participantFromCompany: formData.participantFromCompany || '',
      createdAt: new Date()
    };

    addExpense(newExpense);
    setSuccess('経費データが正常に保存されました！');
    
    // フォームをリセット
    setFormData({
      date: '',
      totalAmount: 0,
      taxRate: 10,
      currency: 'JPY',
        category: '',
        department: '',
        isQualified: 'Not Qualified',
        ocrText: '',
        description: '',
        participantFromClient: '',
        participantFromCompany: ''
    });
    
    // OCR結果をクリア
    setOCRResult(null);
    
    // 成功メッセージを3秒後にクリア
    setTimeout(() => setSuccess(null), 3000);
  };

  const baseAmount = calculateBaseFromTotal(formData.totalAmount || 0, formData.taxRate || 10);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 成功メッセージ */}
      {success && (
        <div className="card border-green-500/30 bg-green-900/20 animate-fade-in">
          <div className="card-body">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="font-semibold text-green-300">保存完了</h3>
                <p className="text-green-200">{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR結果表示 */}
      {ocrResult && (
        <div className="card border-blue-500/30 bg-blue-900/20">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-300">OCR抽出結果</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-300">抽出テキスト:</span>
                <div className="mt-2 p-3 bg-gray-800/80 rounded-lg border border-gray-600/50 text-gray-200 max-h-32 overflow-y-auto">
                  {ocrResult.text}
                </div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium text-blue-300">抽出日付:</span> {ocrResult.date || '未検出'}</div>
                <div><span className="font-medium text-blue-300">抽出金額:</span> ¥{ocrResult.totalAmount?.toLocaleString() || '未検出'}</div>
                <div><span className="font-medium text-blue-300">適格判定:</span> {ocrResult.isQualified ? '適格' : '非適格'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインフォーム */}
      <form onSubmit={handleSubmit} className="card animate-slide-in">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <Save className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">経費データ入力</h2>
          </div>
        </div>

        <div className="card-body space-y-8">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 日付 */}
            <div className="form-group">
              <label className="form-label">
                <Calendar className="w-4 h-4" />
                日付 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`form-input ${errors.date ? 'error' : ''}`}
                required
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>

            {/* 通貨（固定表示） */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign className="w-4 h-4" />
                通貨
              </label>
              <div className="form-input bg-gray-700/50 text-gray-300 cursor-not-allowed">
                {formData.currency}
              </div>
              <p className="text-xs text-gray-400 mt-1">ユーザー設定から自動設定されます</p>
            </div>
          </div>

          {/* 金額計算セクション */}
          <div className="card border-primary-500/30 bg-primary-900/20">
            <div className="card-header">
              <div className="flex items-center space-x-3">
                <Calculator className="w-6 h-6 text-primary-400" />
                <h3 className="text-lg font-semibold text-primary-300">金額計算</h3>
                {isCalculating && (
                  <div className="flex items-center space-x-2 text-primary-400">
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">計算中...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 税抜き金額 */}
                <div className="form-group">
                  <label className="form-label">税抜き金額</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={baseAmount}
                      onChange={(e) => handleAmountChange('baseAmount', e.target.value)}
                      className="form-input pr-12"
                      min="0"
                      step="1"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formData.currency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">税抜き金額を入力すると自動計算されます</p>
                </div>

                {/* 税率 */}
                <div className="form-group">
                  <label className="form-label">
                    <Percent className="w-4 h-4" />
                    税率
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => handleTaxRateChange(Number(e.target.value))}
                    className="form-select"
                  >
                    {TAX_RATES.map(rate => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </div>

                {/* 合計金額（税込み） */}
                <div className="form-group">
                  <label className="form-label">
                    <DollarSign className="w-4 h-4" />
                    合計金額（税込み）<span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => handleAmountChange('totalAmount', e.target.value)}
                      className={`form-input pr-12 ${errors.totalAmount ? 'error' : ''}`}
                      min="0"
                      step="1"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formData.currency}
                    </span>
                  </div>
                  {errors.totalAmount && <p className="form-error">{errors.totalAmount}</p>}
                  <p className="text-xs text-gray-400 mt-1">税込み金額を直接入力することも可能です</p>
                </div>
              </div>

              {/* 計算結果表示 */}
              <div className="mt-4 p-4 bg-gray-800/80 rounded-lg border border-gray-600/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-300">税抜き金額:</span>
                    <span className="ml-2 font-semibold text-white">
                      {formData.currency} {baseAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-300">消費税:</span>
                    <span className="ml-2 font-semibold text-white">
                      {formData.currency} {((formData.totalAmount || 0) - baseAmount).toLocaleString()} ({formData.taxRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 分類情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 経費カテゴリ */}
            <div className="form-group">
              <label className="form-label">
                <FileText className="w-4 h-4" />
                経費カテゴリ <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`form-select ${errors.category ? 'error' : ''}`}
                required
              >
                <option value="">カテゴリを選択してください</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>

            {/* 所属組織（固定表示） */}
            <div className="form-group">
              <label className="form-label">
                <Building className="w-4 h-4" />
                所属組織
              </label>
              <div className="form-input bg-gray-700/50 text-gray-300 cursor-not-allowed">
                {formData.department || '未設定'}
              </div>
              <p className="text-xs text-gray-400 mt-1">ユーザー設定から自動設定されます</p>
            </div>
          </div>

          {/* 適格性 */}
          <div className="form-group">
            <label className="form-label">
              <AlertCircle className="w-4 h-4" />
              適格／非適格区分
            </label>
            <select
              value={formData.isQualified}
              onChange={(e) => setFormData(prev => ({ ...prev, isQualified: e.target.value }))}
              className="form-select"
            >
              {QUALIFICATION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              登録番号またはT+13桁数字がある場合は適格請求書として判定されます
            </p>
          </div>

          {/* 追加情報 */}
          <div className="space-y-6">
            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <FileText className="w-4 h-4" />
                説明 (Description)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input min-h-[100px] resize-y"
                placeholder="経費の詳細な説明を入力してください..."
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                Excelエクスポート時に含まれる説明文です
              </p>
            </div>

            {/* 参加者情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Participant from Client */}
              <div className="form-group">
                <label className="form-label">
                  <User className="w-4 h-4" />
                  # Participant from Client
                </label>
                <input
                  type="text"
                  value={formData.participantFromClient || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, participantFromClient: e.target.value }))}
                  className="form-input"
                  placeholder="クライアント側の参加者名を入力..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  クライアント側の参加者情報
                </p>
              </div>

              {/* Participant from Company */}
              <div className="form-group">
                <label className="form-label">
                  <Users className="w-4 h-4" />
                  # Participant from Company
                </label>
                <input
                  type="text"
                  value={formData.participantFromCompany || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, participantFromCompany: e.target.value }))}
                  className="form-input"
                  placeholder="会社側の参加者名を入力..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  会社側の参加者情報
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* フォームアクション */}
        <div className="card-footer">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 
