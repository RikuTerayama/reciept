'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { detectAndCropReceipt } from '@/lib/receipt-detection';
import { compressImages, preprocessImageForOCR } from '@/lib/image-utils';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { saveImageToStorage } from '@/lib/imageStorage';
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

interface ProcessingResult {
  ok: boolean;
  value?: any;
  reason?: string;
  file: string;
}

export default function BatchUpload({ onComplete }: BatchUploadProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentLanguage] = useState(getCurrentLanguage());
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { addExpense } = useExpenseStore();

  // ファイル処理の共通関数（エラーハンドリング強化）
  const processFile = async (processingFile: ProcessingFile): Promise<ProcessingResult> => {
    const { file } = processingFile;
    
    try {
      // ステップ1: 画像前処理（並列処理）
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'processing', progress: 0.2 }
          : f
      ));
      
      const processedImage = await preprocessImageForOCR(file);
      
      // ステップ2: レシート検出
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, progress: 0.4 }
          : f
      ));
      
      const compressedBlob = await fetch(processedImage).then(r => r.blob());
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const receiptResult = await detectAndCropReceipt(compressedFile);
      
      if (!receiptResult.success) {
        console.log('Receipt detection failed for:', file.name);
      }

      // ステップ3: OCR処理
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, progress: 0.6 }
          : f
      ));
      
      const ocrResult = await processImageWithOCR(compressedFile);
      
      // ステップ4: 画像をストレージに保存
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, progress: 0.8 }
          : f
      ));
      
      try {
        const imageDataUrl = processedImage;
        if (imageDataUrl) {
          await saveImageToStorage(
            imageDataUrl,
            file.name,
            undefined, // expenseIdは後で設定
            ocrResult
          );
        }
      } catch (storageError) {
        console.warn('画像のストレージ保存に失敗しました:', storageError);
        // ストレージ保存の失敗は処理を継続
      }
      
      // 完了状態を設定
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'completed', progress: 1.0, result: ocrResult }
          : f
      ));
      
      return { ok: true, value: ocrResult, file: file.name };
      
    } catch (error) {
      console.error('Processing error for:', file.name, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      
      return { ok: false, reason: errorMessage, file: file.name };
    }
  };

  // 一括処理の改善版（エラーハンドリング強化）
  const processAllFiles = async () => {
    setIsProcessing(true);
    setOverallProgress(0);
    setProcessingError(null);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    const totalFiles = pendingFiles.length;
    
    if (totalFiles === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const results: ProcessingResult[] = [];
      
      // 並列処理（最大3ファイル同時処理）
      const batchSize = 3;
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize);
        
        // バッチ内のファイルを並列処理
        const batchPromises = batch.map(async (processingFile) => {
          const result = await processFile(processingFile);
          results.push(result);
          
          // 進捗を更新
          const completedCount = results.length;
          setOverallProgress((completedCount / totalFiles) * 100);
        });
        
        await Promise.allSettled(batchPromises);
      }
      
      // 結果の集計
      const successfulResults = results.filter(r => r.ok);
      const failedResults = results.filter(r => !r.ok);
      
      if (failedResults.length > 0) {
        const failedFileNames = failedResults.map(r => r.file).join(', ');
        setProcessingError(`${failedResults.length}件のファイルで処理に失敗しました: ${failedFileNames}`);
      }
      
      // 成功した結果をストアに反映
      if (successfulResults.length > 0) {
        successfulResults.forEach(result => {
          if (result.value) {
            addExpense(result.value);
          }
        });
      }
      
    } catch (error) {
      console.error('Batch processing error:', error);
      setProcessingError('一括処理中に予期しないエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
    
    if (onComplete && files.every(f => f.status === 'completed')) {
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

  // ドロップゾーンの設定（PDF対応）
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const clearAll = () => {
    setFiles([]);
    setProcessingError(null);
  };

  const retryFailedFiles = () => {
    const failedFiles = files.filter(f => f.status === 'error');
    if (failedFiles.length > 0) {
      // 失敗したファイルを再処理対象に戻す
      setFiles(prev => prev.map(f => 
        f.status === 'error' 
          ? { ...f, status: 'pending', error: undefined, progress: 0 }
          : f
      ));
      setProcessingError(null);
    }
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
            className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-4" />
            <p className="text-xs md:text-sm text-white leading-relaxed whitespace-pre-line">
              {isDragActive ? t('batchUpload.dragDropText', currentLanguage, 'ドラッグ&ドロップ\nまたはクリックして画像を選択') : t('batchUpload.dragDropText', currentLanguage, 'ドラッグ&ドロップ\nまたはクリックして画像を選択')}
            </p>
            <p className="text-xs text-gray-300 mt-2 text-center leading-relaxed">
              {t('batchUpload.supportedFormats', currentLanguage, 'サポートされている形式：JPG / PNG / PDF')}
            </p>
          </div>

          {/* エラー表示 */}
          {processingError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-medium text-sm">処理エラー</p>
                    <p className="text-red-300 text-xs">{processingError}</p>
                  </div>
                </div>
                {errorCount > 0 && (
                  <button
                    onClick={retryFailedFiles}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    失敗分を再試行
                  </button>
                )}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base md:text-lg font-semibold text-white">
                  {t('batchUpload.processingStatus', currentLanguage, '処理状況')}: {files.length} ファイル
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={processAllFiles}
                    disabled={pendingCount === 0}
                    className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                  >
                    {t('batchUpload.startProcessing', currentLanguage, '処理開始')}
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3 py-2 md:px-4 md:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs md:text-sm"
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
                        <p className="text-xs md:text-sm text-white">{processingFile.file.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {processingFile.status === 'pending' && (
                            <span className="text-xs text-gray-400">待機中</span>
                          )}
                          {processingFile.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                              <span className="text-xs text-blue-400">処理中</span>
                              {/* 個別ファイルのプログレスバー */}
                              <div className="w-16 bg-gray-700 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${processingFile.progress * 100}%` }}
                                ></div>
                              </div>
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
                              <span className="text-xs text-red-300 max-w-32 truncate" title={processingFile.error}>
                                {processingFile.error}
                              </span>
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
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
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
