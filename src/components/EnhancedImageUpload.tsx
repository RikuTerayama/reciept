'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Image as ImageIcon, X, CheckCircle, AlertCircle, FileText, Plus, ArrowRight } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { useExpenseStore } from '@/lib/store';
import { detectReceipt } from '@/lib/receipt-detection';
import { fileToBase64, compressImage, generateReceiptNumber } from '@/lib/image-utils';
import { OCRResult, ExpenseData } from '@/types';
import ExpenseForm from './ExpenseForm';

interface EnhancedImageUploadProps {
  onOCRComplete?: () => void;
}

type UploadMode = 'single' | 'batch';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  ocrResult?: OCRResult;
  error?: string;
}

export default function EnhancedImageUpload({ onOCRComplete }: EnhancedImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [showReceiptDetection, setShowReceiptDetection] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showDataForm, setShowDataForm] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const { setOCRResult } = useExpenseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // 各ファイルを処理
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadedFiles.length + i;
      const file = newFiles[i].file;
      
      try {
        // ステータスを処理中に更新
        setUploadedFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { ...f, status: 'processing' } : f
        ));

        let processedImage = file;

        // レシート検出が有効な場合
        if (showReceiptDetection) {
          try {
            const detectionResult = await detectReceipt(file);
            if (detectionResult.success && detectionResult.croppedImage) {
              const response = await fetch(detectionResult.croppedImage);
              const blob = await response.blob();
              processedImage = new File([blob], file.name, { type: file.type });
            }
          } catch (error) {
            console.error('レシート検出エラー:', error);
          }
        }

        // 画像を圧縮
        const compressedImage = await compressImage(processedImage, 0.8);

        // OCR処理
        const ocrResult = await processImageWithOCR(processedImage);

        // OCR結果を保存
        const enhancedOCRResult: OCRResult = {
          ...ocrResult,
          imageData: compressedImage,
          receiptNumber: generateReceiptNumber(ocrResult.date || new Date().toISOString().split('T')[0], ocrResult.totalAmount || 0)
        };

        // ステータスを完了に更新
        setUploadedFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { ...f, status: 'completed', ocrResult: enhancedOCRResult } : f
        ));

        // 単一アップロードの場合はOCR結果を設定
        if (uploadMode === 'single') {
          setOCRResult(enhancedOCRResult);
          if (onOCRComplete) {
            onOCRComplete();
          }
        }

      } catch (error) {
        console.error('ファイル処理エラー:', error);
        setUploadedFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { ...f, status: 'error', error: '処理に失敗しました' } : f
        ));
      }
    }
  }, [showReceiptDetection, uploadMode, uploadedFiles.length, setOCRResult, onOCRComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: uploadMode === 'batch'
  });

  const handleDataFormComplete = () => {
    if (uploadMode === 'batch' && currentFileIndex < uploadedFiles.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
    } else {
      setShowDataForm(false);
      setCurrentFileIndex(0);
      setUploadedFiles([]);
    }
  };

  const handleFileDataInput = (fileId: string) => {
    const fileIndex = uploadedFiles.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      setCurrentFileIndex(fileIndex);
      setShowDataForm(true);
      const file = uploadedFiles[fileIndex];
      if (file.ocrResult) {
        setOCRResult(file.ocrResult);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');

  return (
    <div className="space-y-6">
      {/* アップロードモード選択 */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-white">アップロードモード</h3>
        </div>
        <div className="card-body">
          <div className="flex space-x-4">
            <button
              onClick={() => setUploadMode('single')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                uploadMode === 'single'
                  ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>単一アップロード</span>
              </div>
              <p className="text-xs mt-2 opacity-75">1枚ずつアップロード</p>
            </button>
            <button
              onClick={() => setUploadMode('batch')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                uploadMode === 'batch'
                  ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>一括アップロード</span>
              </div>
              <p className="text-xs mt-2 opacity-75">複数枚まとめてアップロード</p>
            </button>
          </div>
        </div>
      </div>

      {/* アップロードエリア */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {uploadMode === 'single' ? '単一アップロード' : '一括アップロード'}
            </h3>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showReceiptDetection}
                onChange={(e) => setShowReceiptDetection(e.target.checked)}
                className="rounded"
              />
              <span>レシート検出</span>
            </label>
          </div>
        </div>
        <div className="card-body">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {isDragActive ? 'ファイルをドロップしてください' : 'ファイルをドラッグ&ドロップまたはクリック'}
                </h4>
                <p className="text-gray-300">
                  {uploadMode === 'single' 
                    ? '画像ファイルを1枚選択してください'
                    : '画像ファイルを複数選択できます'
                  }
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = uploadMode === 'batch';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) {
                        onDrop(files);
                      }
                    };
                    input.click();
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>カメラで撮影</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">アップロード済みファイル</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.file.name}</p>
                      <p className="text-sm text-gray-300">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploading' && (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">アップロード中</span>
                      </div>
                    )}
                    {file.status === 'processing' && (
                      <div className="flex items-center space-x-2 text-blue-400">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">処理中</span>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400">完了</span>
                        {uploadMode === 'batch' && (
                          <button
                            onClick={() => handleFileDataInput(file.id)}
                            className="btn-primary flex items-center space-x-1 text-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>データ入力</span>
                          </button>
                        )}
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{file.error}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 一括アップロード完了時のアクション */}
            {uploadMode === 'batch' && completedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-primary-900/20 border border-primary-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">データ入力の準備が完了しました</h4>
                    <p className="text-sm text-gray-300">
                      {completedFiles.length}件のファイルを処理しました
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentFileIndex(0);
                      setShowDataForm(true);
                      if (completedFiles[0]?.ocrResult) {
                        setOCRResult(completedFiles[0].ocrResult);
                      }
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>データ入力開始</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* データ入力フォーム */}
      {showDataForm && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">データ入力</h3>
              {uploadMode === 'batch' && (
                <span className="text-sm text-gray-300">
                  {currentFileIndex + 1} / {uploadedFiles.length}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            <ExpenseForm onComplete={handleDataFormComplete} />
          </div>
        </div>
      )}

      {/* サポート情報 */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <h4 className="font-medium mb-1">サポートされている形式</h4>
            <p>JPEG, PNG, GIF, BMP形式の画像ファイル</p>
            <p className="mt-1">レシート自動検出機能により、背景を除去して精度を向上させます。</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
