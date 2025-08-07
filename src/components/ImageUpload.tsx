'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { OCRResult } from '@/types';

interface ImageUploadProps {
  onOCRComplete?: (result: OCRResult) => void;
  onComplete?: () => void;
}

export default function ImageUpload({ onOCRComplete, onComplete }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentLanguage = getCurrentLanguage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);
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
      const ocrResult = await processImageWithOCR(file);

      setProcessingStep(t('imageUpload.processingComplete', currentLanguage, '処理完了！'));
      
      // 結果を親コンポーネントに渡す
      if (onOCRComplete) {
        onOCRComplete(ocrResult);
      }
      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error('Image processing error:', error);
      setError(error instanceof Error ? error.message : '画像処理に失敗しました');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onOCRComplete, onComplete, currentLanguage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false,
    disabled: isProcessing
  });

  const handleCameraCapture = () => {
    // カメラ機能の実装（必要に応じて）
    console.log('Camera capture not implemented yet');
  };

  return (
    <div className="space-y-6">
      {/* アップロードエリア */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-surface-600 hover:border-primary-500 hover:bg-surface-800/50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
            <div>
              <p className="text-base font-medium text-white">{processingStep}</p>
              <p className="text-xs text-surface-400 mt-2">
                {t('imageUpload.processing', currentLanguage, '処理中です。しばらくお待ちください...')}
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
              <p className="text-surface-400 mb-4 text-sm leading-relaxed">
                {t('imageUpload.description', currentLanguage, 'OCRを使って画像から経費情報を自動抽出します。\n背景除去によって認識精度が向上します。')}
              </p>
              
              <div className="flex flex-col gap-3 justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                  className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 text-sm"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t('imageUpload.cameraCapture', currentLanguage, 'カメラで撮影')}</span>
                </button>
                
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 text-sm">
                  <Upload className="w-5 h-5" />
                  <span>{t('imageUpload.selectImage', currentLanguage, '画像を選択')}</span>
                </button>
              </div>
            </div>
            
            <div className="text-xs text-surface-400 mt-2">
              <p className="font-medium mb-2">{t('imageUpload.supportedFormats', currentLanguage, 'サポートされている形式')}</p>
              <p className="leading-relaxed">{t('imageUpload.receiptDetectionDescription', currentLanguage, 'JPEG, PNG, GIF, BMP形式の画像ファイル。\nレシート自動検出機能により、背景を除去して精度を向上させます。')}</p>
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium text-sm">{t('imageUpload.error', currentLanguage, 'エラーが発生しました')}</p>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* プレビュー表示 */}
      {previewImage && (
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

      {/* 処理完了メッセージ */}
      {!isProcessing && previewImage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
                          <div>
                <p className="text-green-400 font-medium text-sm">
                  {t('imageUpload.uploadComplete', currentLanguage, 'アップロード完了')}
                </p>
                <p className="text-green-300 text-xs">
                  {t('imageUpload.moveToDataInput', currentLanguage, '画像が正常に処理されました。データ入力画面に移動してください。')}
                </p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
} 
