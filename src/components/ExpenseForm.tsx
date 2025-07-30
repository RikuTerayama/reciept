'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { ExpenseData } from '@/types';

interface ExpenseFormProps {
  onSave?: (expenseData: ExpenseData) => void;
  onCancel?: () => void;
  initialData?: Partial<ExpenseData>;
}

export default function ExpenseForm({ onSave, onCancel, initialData }: ExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<ExpenseData>>({
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    currency: 'JPY',
    category: '',
    description: '',
    taxRate: 10,
    companyName: '',
    participantFromClient: 0,
    participantFromCompany: 0,
    isQualified: 'Not Qualified',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addExpense } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let processedValue = value;
    
    // 数値フィールドの先頭ゼロ削除
    if (type === 'number' && value) {
      processedValue = value.replace(/^0+/, '') || '0';
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = t('dataInput.validation.required', currentLanguage);
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = t('dataInput.validation.invalidAmount', currentLanguage);
    }

    if (!formData.category) {
      newErrors.category = t('dataInput.validation.required', currentLanguage);
    }

    if (formData.taxRate && (formData.taxRate < 0 || formData.taxRate > 100)) {
      newErrors.taxRate = t('dataInput.validation.invalidTaxRate', currentLanguage);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const expenseData: ExpenseData = {
      id: Date.now().toString(),
      date: formData.date!,
      totalAmount: formData.totalAmount!,
      currency: formData.currency!,
      category: formData.category!,
      description: formData.description || '',
      taxRate: formData.taxRate || 0,
      companyName: formData.companyName || '',
      participantFromClient: formData.participantFromClient || 0,
      participantFromCompany: formData.participantFromCompany || 0,
      isQualified: formData.isQualified!,
      createdAt: new Date()
    };

    addExpense(expenseData);
    
    if (onSave) {
      onSave(expenseData);
    }
  };

  const handleClear = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      currency: 'JPY',
      category: '',
      description: '',
      taxRate: 10,
      companyName: '',
      participantFromClient: 0,
      participantFromCompany: 0,
      isQualified: 'Not Qualified'
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('dataInput.title', currentLanguage)}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.date', currentLanguage)} *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.date ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.amount', currentLanguage)} *</label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.totalAmount ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="1000"
            />
            {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.currency', currentLanguage)}</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="JPY">JPY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.category', currentLanguage)} *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.category ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="">{t('common.select', currentLanguage)}</option>
              <option value="salariesExpense">{t('categories.salariesExpense', currentLanguage)}</option>
              <option value="intervieweeFee">{t('categories.intervieweeFee', currentLanguage)}</option>
              <option value="telephoneAllowance">{t('categories.telephoneAllowance', currentLanguage)}</option>
              <option value="staffWelfare">{t('categories.staffWelfare', currentLanguage)}</option>
              <option value="staffTraining">{t('categories.staffTraining', currentLanguage)}</option>
              <option value="recruitmentExpenses">{t('categories.recruitmentExpenses', currentLanguage)}</option>
              <option value="employmentResidency">{t('categories.employmentResidency', currentLanguage)}</option>
              <option value="travelPerDiem">{t('categories.travelPerDiem', currentLanguage)}</option>
              <option value="travelMeal">{t('categories.travelMeal', currentLanguage)}</option>
              <option value="travelTransportation">{t('categories.travelTransportation', currentLanguage)}</option>
              <option value="travelOthers">{t('categories.travelOthers', currentLanguage)}</option>
              <option value="travelAccommodation">{t('categories.travelAccommodation', currentLanguage)}</option>
              <option value="entertainmentGifts">{t('categories.entertainmentGifts', currentLanguage)}</option>
              <option value="meetingsConferences">{t('categories.meetingsConferences', currentLanguage)}</option>
              <option value="marketingAdvertising">{t('categories.marketingAdvertising', currentLanguage)}</option>
              <option value="marketResearch">{t('categories.marketResearch', currentLanguage)}</option>
              <option value="rentalOthers">{t('categories.rentalOthers', currentLanguage)}</option>
              <option value="officeCleaning">{t('categories.officeCleaning', currentLanguage)}</option>
              <option value="repairMaintenance">{t('categories.repairMaintenance', currentLanguage)}</option>
              <option value="insuranceCorporate">{t('categories.insuranceCorporate', currentLanguage)}</option>
              <option value="subscriptions">{t('categories.subscriptions', currentLanguage)}</option>
              <option value="administrativeCourier">{t('categories.administrativeCourier', currentLanguage)}</option>
              <option value="printingStationery">{t('categories.printingStationery', currentLanguage)}</option>
              <option value="officeSupplies">{t('categories.officeSupplies', currentLanguage)}</option>
              <option value="sundryAdministrative">{t('categories.sundryAdministrative', currentLanguage)}</option>
              <option value="businessRegistration">{t('categories.businessRegistration', currentLanguage)}</option>
              <option value="finesPenalties">{t('categories.finesPenalties', currentLanguage)}</option>
              <option value="bankCharges">{t('categories.bankCharges', currentLanguage)}</option>
              <option value="others">{t('categories.others', currentLanguage)}</option>
              <option value="houseAllowance">{t('categories.houseAllowance', currentLanguage)}</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.description', currentLanguage)}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder={t('dataInput.descriptionPlaceholder', currentLanguage)}
            />
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('dataInput.title', currentLanguage)}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.taxRate', currentLanguage)} (%)</label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleInputChange}
              min="0"
              max="100"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white ${
                errors.taxRate ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.taxRate && <p className="text-red-500 text-sm mt-1">{errors.taxRate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.companyName', currentLanguage)}</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder={t('dataInput.companyNamePlaceholder', currentLanguage)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.participantFromClient', currentLanguage)}</label>
            <input
              type="number"
              name="participantFromClient"
              value={formData.participantFromClient}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.participantFromCompany', currentLanguage)}</label>
            <input
              type="number"
              name="participantFromCompany"
              value={formData.participantFromCompany}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('dataInput.qualification', currentLanguage)}</label>
            <select
              name="isQualified"
              value={formData.isQualified}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="Qualified invoice/receipt">{t('qualifications.qualifiedInvoice', currentLanguage)}</option>
              <option value="Qualified(by public transportation exception)">{t('qualifications.qualifiedPublicTransport', currentLanguage)}</option>
              <option value="Qualified(by business trip/allowance exception)">{t('qualifications.qualifiedBusinessTrip', currentLanguage)}</option>
              <option value="Not Qualified">{t('qualifications.notQualified', currentLanguage)}</option>
            </select>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t('dataInput.clear', currentLanguage)}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t('common.cancel', currentLanguage)}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('dataInput.save', currentLanguage)}
        </button>
      </div>
    </div>
  );
} 
