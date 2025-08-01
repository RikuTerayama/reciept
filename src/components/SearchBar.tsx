'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface SearchFilters {
  searchTerm: string;
  query?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  department?: string; // 追加
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  isQualified?: string;
}

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: string[];
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  onClear?: () => void;
  departments?: string[];
  className?: string;
}

export default function SearchBar({ 
  filters,
  onFiltersChange,
  onSearch, 
  onReset,
  onClear, 
  categories, 
  departments = [], 
  className = '' 
}: SearchBarProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch(localFilters);
  }, [localFilters, onSearch]);

  const handleClear = useCallback(() => {
    const clearedFilters = { searchTerm: '' };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear?.();
  }, [onClear, onFiltersChange]);

  const handleInputChange = (field: keyof SearchFilters, value: string | number) => {
    const updatedFilters = { ...localFilters, [field]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 基本検索 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={localFilters.searchTerm}
          onChange={(e) => handleInputChange('searchTerm', e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="経費を検索..."
          className="form-input pl-10 pr-12"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {localFilters.searchTerm && (
            <button
              onClick={() => handleInputChange('searchTerm', '')}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1 rounded-md transition-colors ${
              showAdvanced 
                ? 'text-primary-400 bg-primary-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 高度な検索 */}
      {showAdvanced && (
        <div className="card animate-slide-down">
          <div className="card-body space-y-4">
            <h3 className="text-lg font-medium text-white">詳細検索</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日付範囲 */}
              <div className="space-y-2">
                <label className="form-label">日付範囲</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                    className="form-input text-sm"
                    placeholder="開始日"
                  />
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleInputChange('dateTo', e.target.value)}
                    className="form-input text-sm"
                    placeholder="終了日"
                  />
                </div>
              </div>

              {/* 金額範囲 */}
              <div className="space-y-2">
                <label className="form-label">金額範囲</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.amountMin || ''}
                    onChange={(e) => handleInputChange('amountMin', Number(e.target.value))}
                    className="form-input text-sm"
                    placeholder="最小金額"
                  />
                  <input
                    type="number"
                    value={filters.amountMax || ''}
                    onChange={(e) => handleInputChange('amountMax', Number(e.target.value))}
                    className="form-input text-sm"
                    placeholder="最大金額"
                  />
                </div>
              </div>

              {/* カテゴリ */}
              <div className="space-y-2">
                <label className="form-label">カテゴリ</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="">すべてのカテゴリ</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* 部署 */}
              <div className="space-y-2">
                <label className="form-label">部署</label>
                <select
                  value={localFilters.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="">すべての部署</option>
                  {departments.map((department: string) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700/50">
              <button
                onClick={handleClear}
                className="btn-ghost"
              >
                クリア
              </button>
              <button
                onClick={handleSearch}
                className="btn-primary"
              >
                検索
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
