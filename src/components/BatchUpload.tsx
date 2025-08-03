'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { detectReceipt } from '@/lib/receipt-detection';
import { compressImages, preprocessImageForOCR } from '@/lib/image-utils';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { useExpenseStore } from '@/lib/store';

interface BatchUploadProps {
  onComplete?: () => void;
}

interface ProcessingFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

export default function BatchUpload({ onComplete }: BatchUploadProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentLanguage] = useState(getCurrentLanguage());
  const { addExpense } = useExpenseStore();

  const processFile = async (processingFile: ProcessingFile): Promise<void> => {
    const { file } = processingFile;
    
    try {
      // ステップ1: 画像前処理（並列処理）
      const processedImage = await preprocessImageForOCR(file);
      
      // ステップ2: レシート検出
      const compressedBlob = await fetch(processedImage).then(r => r.blob());
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const isReceipt = await detectReceipt(compressedFile);
      
      if (!isReceipt) {
        console.log('Receipt detection failed for:', file.name);
      }

      // ステップ3: OCR処理
      const ocrResult = await processImageWithOCR(compressedFile);
      
      // 結果を更新
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'completed', result: ocrResult }
          : f
      ));
      
    } catch (error) {
      console.error('Processing error for:', file.name, error);
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : f
      ));
    }
  };

  const processAllFiles = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    const totalFiles = pendingFiles.length;
    
    if (totalFiles === 0) {
      setIsProcessing(false);
      return;
    }

    // 並列処理（最大3ファイル同時処理）
    const batchSize = 3;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      
      // バッチ内のファイルを並列処理
      const promises = batch.map(async (processingFile) => {
        // ステータスを処理中に更新
        setFiles(prev => prev.map(f => 
          f.file === processingFile.file 
            ? { ...f, status: 'processing', progress: 0 }
            : f
        ));
        
        await processFile(processingFile);
        
        // 進捗を更新
        setOverallProgress((i + batch.length) / totalFiles * 100);
      });
      
      await Promise.all(promises);
    }
    
    setIsProcessing(false);
    
    if (onComplete) {
      setTimeout(onComplete, 1000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: ProcessingFile[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.pdf']
    },
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6">
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
                <h3 className="text-lg font-semibold text-white">
                  {t('batchUpload.processingStatus', currentLanguage, '処理状況')}: {files.length} ファイル
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={processAllFiles}
                    disabled={pendingCount === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('batchUpload.startProcessing', currentLanguage, '処理開始')}
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('batchUpload.clearAll', currentLanguage, 'すべてクリア')}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((processingFile, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg border border-surface-700">
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{processingFile.file.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {processingFile.status === 'pending' && (
                            <span className="text-xs text-gray-400">待機中</span>
                          )}
                          {processingFile.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span className="text-xs text-blue-400">処理中</span>
                            </div>
                          )}
                          {processingFile.status === 'completed' && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-400">{t('batchUpload.completed', currentLanguage, '完了')}</span>
                            </div>
                          )}
                          {processingFile.status === 'error' && (
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-400">{t('batchUpload.failed', currentLanguage, '失敗')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(processingFile.file)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm text-gray-400">
                <span>完了: {completedCount}</span>
                <span>エラー: {errorCount}</span>
                <span>待機: {pendingCount}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-400">{t('batchUpload.processing', currentLanguage, '処理中')}</p>
          
          {/* 全体のプログレスバー */}
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{Math.round(overallProgress)}%</p>
        </div>
      )}
    </div>
  );
} 
