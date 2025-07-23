'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import { useExpenseStore } from '@/lib/store';
import { extractTextFromImage, validateOCRResult } from '@/lib/ocr';

export default function ImageUpload() {
  const [dragActive, setDragActive] = useState(false);
  const { setOCRResult, setProcessing, isProcessing } = useExpenseStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // 画像ファイルかどうかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setProcessing(true);
    
    try {
      const result = await extractTextFromImage(file);
      const errors = validateOCRResult(result);
      
      if (errors.length > 0) {
        alert(`OCR処理で以下の問題が発生しました:\n${errors.join('\n')}`);
      }
      
      setOCRResult(result);
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('画像の処理中にエラーが発生しました');
    } finally {
      setProcessing(false);
    }
  }, [setOCRResult, setProcessing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive || dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <div>
              <p className="text-lg font-medium text-gray-900">画像を処理中...</p>
              <p className="text-sm text-gray-500">OCR処理には数秒かかる場合があります</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {isDragActive ? (
              <Upload className="w-12 h-12 text-primary-500" />
            ) : (
              <FileImage className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'ここにドロップしてください' : 'レシート画像をアップロード'}
              </p>
              <p className="text-sm text-gray-500">
                クリックしてファイルを選択するか、ここにドラッグ&ドロップしてください
              </p>
              <p className="text-xs text-gray-400 mt-2">
                対応形式: JPEG, PNG, GIF, BMP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
