'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle, X, Camera, Grid3X3, List, Trash2 } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr';
import { detectReceiptInImage, simpleReceiptDetection } from '@/lib/receipt-detection';
import { addExpenseToStorage } from '@/lib/storage';
import { ExpenseData, OCRResult } from '@/types';

interface BatchUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  ocrResult?: OCRResult;
  error?: string;
  croppedImage?: string;
}

interface BatchUploadProps {
  onComplete?: () => void;
}

export default function BatchUpload({ onComplete }: BatchUploadProps) {
  const [uploadItems, setUploadItems] = useState<BatchUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [useReceiptDetection, setUseReceiptDetection] = useState(true);
  const { addExpense } = useExpenseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newItems: BatchUploadItem[] = acceptedFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending'
    }));

    setUploadItems(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const processBatch = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i];
      
      if (item.status === 'pending') {
        // ステータスを処理中に更新
        setUploadItems(prev => prev.map((it, index) => 
          index === i ? { ...it, status: 'processing' } : it
        ));

        try {
          let processedFile = item.file;
          let croppedImage: string | undefined;

          // レシート検出を実行
          if (useReceiptDetection) {
            const detectionResult = await detectReceiptInImage(item.file);
            
            if (detectionResult.success && detectionResult.croppedImage) {
              // 検出されたレシート領域を使用
              croppedImage = detectionResult.croppedImage;
              // Base64からBlobに変換してFileオブジェクトを作成
              const response = await fetch(croppedImage);
              const blob = await response.blob();
              processedFile = new File([blob], item.file.name, { type: item.file.type });
            } else {
              // 検出に失敗した場合は簡易版を使用
              const simpleResult = await simpleReceiptDetection(item.file);
              if (simpleResult.success && simpleResult.croppedImage) {
                croppedImage = simpleResult.croppedImage;
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                processedFile = new File([blob], item.file.name, { type: item.file.type });
              }
            }
          }

          // OCR処理を実行
          const ocrResult = await extractTextFromImage(processedFile);
          const errors = validateOCRResult(ocrResult);

          if (errors.length === 0) {
            // 成功
            setUploadItems(prev => prev.map((it, index) => 
              index === i ? { 
                ...it, 
                status: 'success', 
                ocrResult,
                croppedImage
              } : it
            ));

            // 自動的に経費データを作成
            const expenseData: ExpenseData = {
              id: Date.now().toString(),
              date: ocrResult.date || new Date().toISOString().split('T')[0],
              totalAmount: ocrResult.totalAmount || 0,
              currency: 'JPY',
              category: '',
              description: ocrResult.text || '',
              participantFromClient: '',
              participantFromCompany: '',
              taxRate: ocrResult.taxRate || 10,
              isQualified: ocrResult.isQualified ? 'Qualified invoice/receipt' : 'Not Qualified',
              imageData: ocrResult.imageData,
              receiptNumber: ocrResult.receiptNumber,
              ocrText: ocrResult.text,
              createdAt: new Date()
            };

            addExpense(expenseData);
            addExpenseToStorage(expenseData);
          } else {
            // エラー
            setUploadItems(prev => prev.map((it, index) => 
              index === i ? { 
                ...it, 
                status: 'error', 
                error: errors.join(', '),
                ocrResult,
                croppedImage
              } : it
            ));
          }
        } catch (error) {
          setUploadItems(prev => prev.map((it, index) => 
            index === i ? { 
              ...it, 
              status: 'error', 
              error: '処理中にエラーが発生しました'
            } : it
          ));
        }
      }
    }
    
    setIsProcessing(false);
    
    // 処理完了後にコールバックを呼び出す
    if (onComplete && successCount > 0) {
      setTimeout(onComplete, 1000);
    }
  };

  const removeItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setUploadItems([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FileImage className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileImage className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'processing':
        return '処理中';
      case 'success':
        return '完了';
      case 'error':
        return 'エラー';
      default:
        return '不明';
    }
  };

  const pendingCount = uploadItems.filter(item => item.status === 'pending').length;
  const successCount = uploadItems.filter(item => item.status === 'success').length;
  const errorCount = uploadItems.filter(item => item.status === 'error').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">一括アップロード</h2>
          <p className="text-gray-600">複数のレシート画像を同時に処理できます</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useReceiptDetection}
              onChange={(e) => setUseReceiptDetection(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">レシート自動検出</span>
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      {uploadItems.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{uploadItems.length}</div>
                <div className="text-sm text-gray-600">総数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">待機中</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">完了</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">エラー</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アップロードエリア */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {isDragActive ? 'ここにドロップしてください' : 'レシート画像をアップロード'}
            </p>
            <p className="text-sm text-gray-600">
              複数の画像を選択するか、ここにドラッグ&ドロップしてください
            </p>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      {uploadItems.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={processBatch}
              disabled={isProcessing || pendingCount === 0}
              className="btn-primary flex items-center space-x-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span>{isProcessing ? '処理中...' : '一括処理開始'}</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>全削除</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {pendingCount}件の処理待ち
          </div>
        </div>
      )}

      {/* アップロードアイテム一覧 */}
      {uploadItems.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
          {uploadItems.map((item) => (
            <div
              key={item.id}
              className={`
                card relative overflow-hidden
                ${viewMode === 'grid' ? '' : 'flex items-center space-x-4'}
              `}
            >
              {/* 削除ボタン */}
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>

              {/* サムネイル */}
              <div className={viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20 flex-shrink-0'}>
                {item.croppedImage ? (
                  <img
                    src={item.croppedImage}
                    alt="レシート"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                    <FileImage className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 情報 */}
              <div className={viewMode === 'grid' ? 'p-4' : 'flex-1'}>
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium">{getStatusText(item.status)}</span>
                </div>
                
                <p className="text-sm text-gray-600 truncate mb-2">
                  {item.file.name}
                </p>
                
                {item.ocrResult && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>日付: {item.ocrResult.date || '未検出'}</div>
                    <div>金額: ¥{item.ocrResult.totalAmount?.toLocaleString() || '未検出'}</div>
                  </div>
                )}
                
                {item.error && (
                  <p className="text-xs text-red-500 mt-2">{item.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
