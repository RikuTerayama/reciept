'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr';
import { isPDFFile, validatePDFFile } from '@/lib/pdf';

export default function ImageUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setOCRResult, setProcessing, isProcessing } = useExpenseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setSuccess(null);
    
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

    setProcessing(true);
    
    try {
      let result;
      
      if (isPDF) {
        // PDFの場合は、現在サポートされていないことを示す
        setError('PDFファイルの処理は現在準備中です。画像ファイルをご利用ください。\n\n対応予定：\n• PDFの最初のページを画像に変換\n• 複数ページの処理\n• 高精度なOCR処理');
        setProcessing(false);
        return;
      } else {
        result = await extractTextFromImage(file);
      }
      
      const errors = validateOCRResult(result);
      
      if (errors.length > 0) {
        setError(`OCR処理で以下の問題が発生しました:\n${errors.join('\n')}\n\n手動でデータを入力することも可能です。`);
      } else {
        setSuccess('OCR処理が完了しました！抽出されたデータを確認してください。');
      }
      
      setOCRResult(result);
    } catch (error) {
      console.error('OCR processing error:', error);
      setError('画像の処理中にエラーが発生しました。ファイル形式とサイズを確認してください。');
    } finally {
      setProcessing(false);
    }
  }, [setOCRResult, setProcessing]);

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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
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
              <p className="text-sm text-gray-500">OCR処理には数秒かかる場合があります</p>
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
              <li>• PDFファイルの処理は現在準備中です</li>
              <li>• ファイルサイズは10MB以下にしてください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
