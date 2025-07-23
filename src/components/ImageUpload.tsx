'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileText, Loader2, AlertCircle, CheckCircle, Camera, Crop } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr';
import { isPDFFile, validatePDFFile } from '@/lib/pdf';
import { detectReceiptInImage, simpleReceiptDetection } from '@/lib/receipt-detection';

interface ImageUploadProps {
  onOCRComplete?: () => void;
}

export default function ImageUpload({ onOCRComplete }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [useReceiptDetection, setUseReceiptDetection] = useState(true);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const { setOCRResult, setProcessing, isProcessing } = useExpenseStore();

  // モバイルデバイス検出
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  const processImage = async (file: File) => {
    setError(null);
    setSuccess(null);
    setCroppedImage(null);
    setProcessing(true);
    
    try {
      let processedFile = file;
      let detectionResult = null;

      // レシート検出を実行
      if (useReceiptDetection && file.type.startsWith('image/')) {
        try {
          detectionResult = await detectReceiptInImage(file);
          
          if (detectionResult.success && detectionResult.croppedImage) {
            // 検出されたレシート領域を使用
            setCroppedImage(detectionResult.croppedImage);
            // Base64からBlobに変換
            const response = await fetch(detectionResult.croppedImage);
            processedFile = await response.blob() as File;
          } else {
            // 検出に失敗した場合は簡易版を使用
            const simpleResult = await simpleReceiptDetection(file);
            if (simpleResult.success && simpleResult.croppedImage) {
              setCroppedImage(simpleResult.croppedImage);
              const response = await fetch(simpleResult.croppedImage);
              processedFile = await response.blob() as File;
            }
          }
        } catch (detectionError) {
          console.warn('レシート検出に失敗しました:', detectionError);
          // 検出に失敗しても元の画像で処理を続行
        }
      }

      // OCR処理を実行
      let result;
      
      if (isPDFFile(file)) {
        setError('PDFファイルの処理は現在準備中です。画像ファイルをご利用ください。');
        setProcessing(false);
        return;
      } else {
        result = await extractTextFromImage(processedFile);
      }
      
      const errors = validateOCRResult(result);
      
      if (errors.length > 0) {
        setError(`OCR処理で以下の問題が発生しました:\n${errors.join('\n')}\n\n手動でデータを入力することも可能です。`);
      } else {
        setSuccess('OCR処理が完了しました！自動的にデータ入力画面に遷移します。');
        // 自動遷移のためのコールバック実行
        setTimeout(() => {
          if (onOCRComplete) {
            onOCRComplete();
          }
        }, 2000);
      }
      
      setOCRResult(result);
    } catch (error) {
      console.error('OCR processing error:', error);
      setError('画像の処理中にエラーが発生しました。ファイル形式とサイズを確認してください。');
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // ファイル形式のチェック
    const isImage = file.type.startsWith('image/');
    const isPDF = isPDFFile(file);
    
    if (!isImage && !isPDF) {
      setError('画像ファイル（JPEG、PNG、GIF、BMP）またはPDFファイルを選択してください');
      return;
    }

    // PDFファイルの検証
    if (isPDF) {
      const pdfErrors = validatePDFFile(file);
      if (pdfErrors.length > 0) {
        setError(pdfErrors.join('\n'));
        return;
      }
    }

    await processImage(file);
  }, [useReceiptDetection, onOCRComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(({ file, errors }) => {
        if (errors.some(e => e.code === 'file-too-large')) {
          return 'ファイルサイズが大きすぎます（10MB以下にしてください）';
        }
        if (errors.some(e => e.code === 'file-invalid-type')) {
          return 'サポートされていないファイル形式です';
        }
        return 'ファイルのアップロードに失敗しました';
      });
      setError(errors.join('\n'));
    }
  });

  // カメラ起動用のinput要素
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 背面カメラを起動
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processImage(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* レシート検出設定 */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crop className="w-5 h-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900">レシート自動検出</h3>
                <p className="text-sm text-gray-600">画像からレシート領域を自動的に検出して切り抜きます</p>
              </div>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useReceiptDetection}
                onChange={(e) => setUseReceiptDetection(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">有効</span>
            </label>
          </div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive || dragActive
            ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
            : 'border-gray-300 hover:border-primary-400 hover:shadow-md'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-900">画像を処理中...</p>
              <p className="text-sm text-gray-500">
                {useReceiptDetection ? 'レシート検出とOCR処理を実行中' : 'OCR処理を実行中'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-4">
              {isDragActive ? (
                <Upload className="w-16 h-16 text-primary-500" />
              ) : (
                <>
                  <FileImage className="w-12 h-12 text-gray-400" />
                  <FileText className="w-12 h-12 text-gray-400" />
                </>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xl font-semibold text-gray-900">
                {isDragActive ? 'ここにドロップしてください' : 'レシート画像をアップロード'}
              </p>
              <p className="text-sm text-gray-600">
                クリックしてファイルを選択するか、ここにドラッグ&ドロップしてください
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center space-x-1">
                  <FileImage className="w-4 h-4" />
                  <span>画像ファイル</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>PDFファイル</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                対応形式: JPEG, PNG, GIF, BMP, PDF (10MB以下)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* モバイル用カメラボタン */}
      {isMobile && !isProcessing && (
        <div className="text-center">
          <button
            onClick={handleCameraCapture}
            className="btn-primary flex items-center justify-center space-x-2 mx-auto"
          >
            <Camera className="w-5 h-5" />
            <span>カメラで撮影</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            スマートフォンからカメラで直接撮影できます
            {useReceiptDetection && '（レシート自動検出対応）'}
          </p>
        </div>
      )}

      {/* 切り抜き結果表示 */}
      {croppedImage && (
        <div className="card border-green-200 bg-green-50">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <Crop className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">レシート検出完了</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <img
                src={croppedImage}
                alt="検出されたレシート"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <p className="text-sm text-green-700">
                  レシート領域を自動検出し、切り抜きました。
                </p>
                <p className="text-xs text-green-600 mt-1">
                  この画像を使用してOCR処理を実行します。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium">処理完了</p>
              <p className="mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">エラーが発生しました</p>
              <p className="mt-1 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ヒント */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-white text-xs">i</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-700">ヒント</h4>
            <ul className="text-sm text-blue-600 mt-1 space-y-1">
              <li>• 高解像度の画像を使用すると、OCR精度が向上します</li>
              <li>• レシートがはっきりと見えるように撮影してください</li>
              <li>• レシート自動検出により、背景を除去して精度を向上させます</li>
              <li>• PDFファイルの処理は現在準備中です</li>
              <li>• ファイルサイズは10MB以下にしてください</li>
              {isMobile && (
                <li>• スマートフォンからはカメラで直接撮影できます</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
