'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { OCRResult } from '@/types';

interface ImageUploadProps {
  onOCRComplete?: (result: OCRResult) => void;
  onComplete?: () => void;
}

export default function ImageUpload({ onOCRComplete, onComplete }: ImageUploadProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingStep, setProcessingStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const currentLanguage = getCurrentLanguage();
  
  // ファイル入力とカメラ入力のref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ファイル処理の共通関数
  const processFile = async (file: File) => {
    if (!file) return;
    
    setStatus('processing');
    setError(null);
    setProgress(0);
    setProcessingStep(t('imageUpload.processing', currentLanguage, '画像を処理中...'));

    try {
      // プレビュー画像を設定
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // OCR処理
      setProcessingStep(t('imageUpload.ocrProcessing', currentLanguage, 'OCR処理中...'));
      setProgress(0.5);
      
      const ocrResult = await processImageWithOCR(file);

      setProcessingStep(t('imageUpload.processingComplete', currentLanguage, 'OCR処理完了！'));
      setProgress(1.0);
      
      // 成功状態を設定
      setStatus('success');
      
      // 少し遅延してから結果を親コンポーネントに渡す（UX改善のため）
      setTimeout(() => {
        if (onOCRComplete) {
          onOCRComplete(ocrResult);
        }
        if (onComplete) {
          onComplete();
        }
      }, 1500); // 1.5秒後に自動遷移

    } catch (error) {
      console.error('Image processing error:', error);
      setError(error instanceof Error ? error.message : 'OCR処理中にエラーが発生しました。もう一度お試しください。');
      setStatus('error');
    } finally {
      setProcessingStep('');
    }
  };

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // 同じファイルを再度選択できるようにリセット
    event.target.value = '';
  };

  // カメラ撮影ハンドラー
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // 同じファイルを再度選択できるようにリセット
    event.target.value = '';
  };

  // ドロップゾーンの設定（PDF対応）
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await processFile(acceptedFiles[0]);
      }
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: status === 'processing'
  });

  // ファイル選択ボタンのクリック
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // カメラボタンのクリック
  const handleCameraButtonClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* 隠しカメラ入力 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* アップロードエリア */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-surface-600 hover:border-primary-500 hover:bg-surface-800/50'
          }
          ${status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {status === 'processing' ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
            <div>
              <p className="text-base font-medium text-white">{processingStep}</p>
              {/* プログレスバー */}
              <div className="w-full max-w-xs mx-auto bg-surface-700 rounded-full h-2 mt-3">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-surface-400 mt-2">
                {processingStep.includes('OCR') 
                  ? t('imageUpload.ocrProcessing', currentLanguage, 'OCR処理中です。しばらくお待ちください...')
                  : t('imageUpload.processing', currentLanguage, '画像を処理中です。しばらくお待ちください...')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="w-16 h-16 bg-secondary-600 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('imageUpload.title', currentLanguage, 'レシート画像をアップロード')}
              </h3>

              <div className="flex flex-col gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleCameraButtonClick}
                  className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 text-sm"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t('imageUpload.cameraCapture', currentLanguage, 'カメラで撮影')}</span>
                </button>
                
                <button 
                  type="button"
                  onClick={handleFileButtonClick}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 text-sm"
                >
                  <Upload className="w-5 h-5" />
                  <span>{t('imageUpload.selectImage', currentLanguage, '画像を選択')}</span>
                </button>
              </div>
            </div>
            
            <div className="text-xs text-surface-400 mt-2">
              <p className="font-medium mb-2">{t('imageUpload.supportedFormats', currentLanguage, 'サポートされている形式')}</p>
              <p className="leading-relaxed whitespace-pre-line">
                {t('imageUpload.receiptDetectionDescription', currentLanguage, 'JPEG, PNG, GIF, BMP, PDF形式のファイル。\nレシート自動検出機能により、背景を除去して精度を向上させます。')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium text-sm">{t('imageUpload.error', currentLanguage, 'OCR処理エラー')}</p>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* 成功時のプレビュー表示 */}
      {previewImage && status === 'success' && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white">
              {t('imageUpload.uploadComplete', currentLanguage, 'アップロード完了')}
            </h4>
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs">{t('imageUpload.processingComplete', currentLanguage, '処理完了')}</span>
            </div>
          </div>
          
          <div className="relative">
            <img
              src={previewImage}
              alt="Receipt preview"
              className="max-w-full h-auto rounded-lg border border-surface-600"
            />
          </div>
        </div>
      )}

      {/* 成功時の処理完了メッセージ */}
      {status === 'success' && previewImage && !error && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium text-sm">
                {t('imageUpload.uploadComplete', currentLanguage, 'OCR処理完了')}
              </p>
              <p className="text-green-300 text-xs">
                {t('imageUpload.moveToDataInput', currentLanguage, 'OCR処理が完了しました。データ入力画面に移動します。')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
