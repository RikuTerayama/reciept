'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { processImageWithOCR } from '@/lib/ocr';
import { OCRResult } from '@/types';
import { useExpenseStore } from '@/lib/store';
import { detectReceipt } from '@/lib/receipt-detection';
import { fileToBase64, compressImage, generateReceiptNumber } from '@/lib/image-utils';

interface ImageUploadProps {
  onOCRComplete?: () => void;
}

export default function ImageUpload({ onOCRComplete }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showReceiptDetection, setShowReceiptDetection] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const { setOCRResult, setProcessing } = useExpenseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);
    setProcessingStatus('画像を処理中...');

    try {
      // 画像をBase64に変換
      const base64Image = await fileToBase64(file);
      setPreviewImage(base64Image);

      let processedImage = base64Image;

      // レシート検出が有効な場合
      if (showReceiptDetection) {
        setProcessingStatus('レシートを検出中...');
        try {
          const detectionResult = await detectReceipt(file);
          if (detectionResult.success && detectionResult.croppedImage) {
            processedImage = detectionResult.croppedImage;
            setCroppedImage(detectionResult.croppedImage);
            setProcessingStatus('レシート検出完了');
          } else {
            setProcessingStatus('レシート検出に失敗しました。元画像を使用します。');
          }
        } catch (error) {
          console.error('レシート検出エラー:', error);
          setProcessingStatus('レシート検出に失敗しました。元画像を使用します。');
        }
      }

      // 画像を圧縮
      setProcessingStatus('画像を圧縮中...');
      const compressedImage = await compressImage(processedImage, 0.8);

      // OCR処理
      setProcessingStatus('OCR処理中...');
      const ocrResult = await processImageWithOCR(file);

      // OCR結果を保存（型安全な方法）
      const enhancedOCRResult: OCRResult = {
        ...ocrResult,
        imageData: compressedImage, // 圧縮された画像データを保存
        receiptNumber: generateReceiptNumber(ocrResult.date || new Date().toISOString().split('T')[0], ocrResult.totalAmount || 0)
      };

      setOCRResult(enhancedOCRResult);

      setProcessingStatus('処理完了！');
      setIsProcessing(false);

      // OCR完了後のコールバック
      if (onOCRComplete) {
        setTimeout(onOCRComplete, 1000);
      }

    } catch (error) {
      console.error('画像処理エラー:', error);
      setProcessingStatus('エラーが発生しました。');
      setIsProcessing(false);
    }
  }, [showReceiptDetection, setOCRResult, onOCRComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false
  });

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    
    input.click();
  };

  const clearPreview = () => {
    setPreviewImage(null);
    setCroppedImage(null);
    setOCRResult(null);
  };

  return (
    <div className="space-y-6">
      {/* レシート検出トグル */}
      <div className="flex items-center justify-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showReceiptDetection}
            onChange={(e) => setShowReceiptDetection(e.target.checked)}
            className="rounded border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-800"
          />
          <span className="text-sm font-medium text-gray-300">レシート自動検出</span>
        </label>
      </div>

      {/* アップロードエリア */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-gray-600 hover:border-primary-400 hover:bg-gray-800/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {!isProcessing && !previewImage && (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                レシート画像をアップロード
              </h3>
              <p className="text-gray-300 mb-4">
                ドラッグ&ドロップまたはクリックして画像を選択
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraCapture();
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>カメラで撮影</span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>画像を選択</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 処理中表示 */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-300">{processingStatus}</p>
          </div>
        )}

        {/* プレビュー表示 */}
        {previewImage && !isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">アップロード完了</h3>
              <button
                onClick={clearPreview}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 元画像 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">元画像</h4>
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="元画像"
                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                  />
                </div>
              </div>
              
              {/* 処理済み画像 */}
              {croppedImage && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>レシート検出済み</span>
                  </h4>
                  <div className="relative">
                    <img
                      src={croppedImage}
                      alt="処理済み画像"
                      className="w-full h-48 object-cover rounded-lg border border-green-500/30"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>画像が正常に処理されました。データ入力画面に移動してください。</span>
            </div>
          </div>
        )}
      </div>

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
