'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { detectReceipt } from '@/lib/receipt-detection';
import { compressImage } from '@/lib/image-utils';
import { getCurrentLanguage, t } from '@/lib/i18n';

interface ImageUploadProps {
  onOCRComplete?: () => void;
  onComplete?: () => void;
}

export default function ImageUpload({ onOCRComplete, onComplete }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setProgress(0);

    try {
      // ステップ1: 画像圧縮 (20%)
      setProcessingStep('読み取り中...');
      setProgress(20);
      const compressedImage = await compressImage(file);
      
      // ステップ2: レシート検出 (40%)
      setProgress(40);
      const isReceipt = await detectReceipt(compressedImage);
      
      if (!isReceipt) {
        console.log('Receipt detection failed, using original image');
      }

      // ステップ3: OCR処理 (80%)
      setProgress(80);
      const ocrResult = await processImageWithOCR(compressedImage);
      
      // 完了 (100%)
      setProgress(100);
      setProcessingStep('処理完了');
      setSuccess(true);
      
      if (onOCRComplete) {
        onOCRComplete();
      }

      if (onComplete) {
        setTimeout(onComplete, 1500);
      }

    } catch (err) {
      console.error('Processing error:', err);
      setError(t('imageUpload.error', currentLanguage));
    } finally {
      setIsProcessing(false);
    }
  }, [onOCRComplete, onComplete, currentLanguage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.pdf']
    },
    multiple: false
  });

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.png,.jpg,.jpeg,.pdf';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 text-center">
      {!isProcessing && !success && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">
              {isDragActive ? t('imageUpload.dragDropText', currentLanguage) : t('imageUpload.dragDropText', currentLanguage)}
            </p>
            <p className="text-xs text-gray-500 mt-2">サポートされている形式：JPG / PNG / PDF</p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleCameraCapture}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Camera className="w-4 h-4" />
              <span>{t('imageUpload.cameraCapture', currentLanguage)}</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-400">{processingStep}</p>
          
          {/* プログレスバー */}
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">{progress}%</p>
        </div>
      )}

      {success && (
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="text-sm text-green-600">{t('imageUpload.uploadComplete', currentLanguage)}</p>
          <p className="text-xs text-gray-500">{t('imageUpload.moveToDataInput', currentLanguage)}</p>
        </div>
      )}

      {error && (
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
} 
