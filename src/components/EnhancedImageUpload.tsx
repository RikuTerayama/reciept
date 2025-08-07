'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { detectAndCropReceipt, preprocessImageForOCR } from '@/lib/receipt-detection';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { OCRResult } from '@/types';

interface EnhancedImageUploadProps {
  onOCRComplete: (result: OCRResult) => void;
}

export default function EnhancedImageUpload({ onOCRComplete }: EnhancedImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [receiptDetectionResult, setReceiptDetectionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const currentLanguage = getCurrentLanguage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError(null);
    setProcessingStep(t('imageUpload.processing', currentLanguage, '画像を処理中...'));

    try {
      // 1. レシート自動検出
      setProcessingStep(t('imageUpload.detectingReceipt', currentLanguage, 'レシートを検出中...'));
      const detectionResult = await detectAndCropReceipt(file);

      if (detectionResult.success && detectionResult.croppedImage) {
        setReceiptDetectionResult(detectionResult);
        setPreviewImage(detectionResult.croppedImage.toDataURL());
        setProcessingStep(t('imageUpload.receiptDetection', currentLanguage, 'レシート検出完了'));
      } else {
        // レシート検出に失敗した場合は元画像を使用
        setProcessingStep(t('imageUpload.usingOriginalImage', currentLanguage, '元画像を使用します'));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          setPreviewImage(canvas.toDataURL());
        };
        img.src = URL.createObjectURL(file);
      }

      // 2. 画像前処理
      setProcessingStep(t('imageUpload.compressingImage', currentLanguage, '画像を圧縮中...'));
      const preprocessedCanvas = await preprocessImageForOCR(file);

      // 3. OCR処理
      setProcessingStep(t('imageUpload.ocrProcessing', currentLanguage, 'OCR処理中...'));
      const ocrResult = await processImageWithOCR(file);

      setProcessingStep(t('imageUpload.processingComplete', currentLanguage, '処理完了！'));
      
      // 結果を親コンポーネントに渡す
      onOCRComplete(ocrResult);

    } catch (error) {
      console.error('Image processing error:', error);
      setError(error instanceof Error ? error.message : '画像処理に失敗しました');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [onOCRComplete, currentLanguage]);

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
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
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
              <p className="text-lg font-medium text-white">{processingStep}</p>
              <p className="text-sm text-surface-400 mt-2">
                {t('imageUpload.processing', currentLanguage, '処理中です。しばらくお待ちください...')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div className="w-16 h-16 bg-secondary-600 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('imageUpload.title', currentLanguage, 'レシート画像をアップロード')}
              </h3>

              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                  className="px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t('imageUpload.cameraCapture', currentLanguage, 'カメラで撮影')}</span>
                </button>
                
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>{t('imageUpload.selectImage', currentLanguage, '画像を選択')}</span>
                </button>
              </div>
            </div>
            
            <div className="text-sm text-surface-400">
              <p className="font-medium mb-2">{t('imageUpload.supportedFormats', currentLanguage, 'サポートされている形式')}</p>
              <p className="whitespace-pre-line">{t('imageUpload.receiptDetectionDescription', currentLanguage, 'JPEG, PNG, GIF, BMP形式の画像ファイル。\nレシート自動検出機能により、背景を除去して精度を向上させます。')}</p>
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">{t('imageUpload.error', currentLanguage, 'エラーが発生しました')}</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* プレビュー表示 */}
      {previewImage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              {receiptDetectionResult?.success 
                ? t('imageUpload.receiptDetection', currentLanguage, 'レシート検出完了')
                : t('imageUpload.usingOriginalImage', currentLanguage, '元画像を使用')
              }
            </h4>
            {receiptDetectionResult?.success && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{t('imageUpload.receiptDetection', currentLanguage, 'レシート検出成功')}</span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <img
              src={previewImage}
              alt="Receipt preview"
              className="max-w-full h-auto rounded-lg border border-surface-600"
            />
            
            {receiptDetectionResult?.success && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                {t('imageUpload.receiptDetection', currentLanguage, '検出済み')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 処理完了メッセージ */}
      {!isProcessing && previewImage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">
                {t('imageUpload.uploadComplete', currentLanguage, 'アップロード完了')}
              </p>
              <p className="text-green-300 text-sm">
                {t('imageUpload.moveToDataInput', currentLanguage, '画像が正常に処理されました。データ入力画面に移動してください。')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
