'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { detectReceipt } from '@/lib/receipt-detection';
import { compressImage } from '@/lib/image-utils';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';

interface BatchUploadProps {
  onComplete?: () => void;
}

export default function BatchUpload({ onComplete }: BatchUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [progress, setProgress] = useState(0);
  const { addExpense } = useExpenseStore();
  const currentLanguage = getCurrentLanguage();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.pdf']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setProgress(0);
  };

  const processBatch = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setSuccessCount(0);
    setFailedCount(0);
    setProgress(0);

    try {
      // 並列処理で複数ファイルを同時に処理
      const processPromises = files.map(async (file, index) => {
        try {
          setCurrentFile(file.name);
          
          // 画像圧縮
          const compressedImage = await compressImage(file);
          
          // レシート検出（圧縮された画像をFileに変換）
          const compressedBlob = await fetch(compressedImage).then(r => r.blob());
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
          const isReceipt = await detectReceipt(compressedFile);
          
          // OCR処理
          const ocrResult = await processImageWithOCR(compressedFile);
          
          // 経費データとして保存
          const expenseData = {
            id: Date.now().toString() + index,
            date: ocrResult.date || new Date().toISOString().split('T')[0],
            totalAmount: ocrResult.totalAmount || 0,
            currency: 'JPY',
            category: ocrResult.category || '',
            description: ocrResult.description || '',
            taxRate: 10,
            companyName: '',
            participantFromClient: 0,
            participantFromCompany: 0,
            isQualified: 'Not Qualified',
            createdAt: new Date()
          };

          addExpense(expenseData);
          setSuccessCount(prev => prev + 1);
          
          return { success: true, file };
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setFailedCount(prev => prev + 1);
          return { success: false, file, error };
        }
      });

      // 並列実行
      const results = await Promise.all(processPromises);
      
      // 進行状況を更新
      setProcessedCount(files.length);
      setProgress(100);
      setCurrentFile('');

    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      setIsProcessing(false);
    }

    if (onComplete && successCount > 0) {
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div className="space-y-6 text-center">
      {!isProcessing && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-white">
              {isDragActive ? t('batchUpload.dragDropText', currentLanguage, 'ドラッグ&ドロップまたはクリックして画像を選択') : t('batchUpload.dragDropText', currentLanguage, 'ドラッグ&ドロップまたはクリックして画像を選択')}
            </p>
            <p className="text-xs text-gray-300 mt-2">サポートされている形式：JPG / PNG / PDF</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">{t('batchUpload.title', currentLanguage, '一括アップロード')}</h3>
                <button
                  onClick={clearAll}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                >
                  {t('batchUpload.clearAll', currentLanguage, 'すべてクリア')}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={processBatch}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                {t('batchUpload.startProcessing', currentLanguage, '処理開始')}
              </button>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-gray-400">読み取り中...</p>
          <p className="text-xs text-gray-500">{currentFile}</p>
          
          {/* プログレスバー */}
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{processedCount} / {files.length} 完了</p>
          <div className="text-sm text-gray-400">
                            {processedCount} / {files.length} {t('batchUpload.completed', currentLanguage, '完了')}
          </div>
        </div>
      )}

      {!isProcessing && processedCount > 0 && (
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <div className="space-y-2">
            <p className="text-sm text-green-600">{t('batchUpload.completed', currentLanguage, '完了')}</p>
            <div className="text-xs text-gray-400 space-y-1">
                              <p>{t('batchUpload.completed', currentLanguage, '完了')}: {successCount}</p>
                <p>{t('batchUpload.failed', currentLanguage, '失敗')}: {failedCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
