'use client';

import React, { useState, useRef, useCallback } from 'react';
import { recognizeReceipt, OcrResult } from '../lib/ocr';
import { VoiceInputButton } from './VoiceInputButton';

// OCRの状態
interface OcrState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  error: string | null;
  result: OcrResult | null;
}

// プロパティ
interface EnhancedImageUploadProps {
  onOcrComplete: (result: OcrResult) => void;
  onVoiceInput: (result: { date?: string; amount?: number; transcript: string; confidence: number }) => void;
  disabled?: boolean;
  className?: string;
  autoNavigate?: boolean;
  showVoiceInput?: boolean;
}

/**
 * 強化された画像アップロードコンポーネント
 * - 高品質OCR処理
 * - リアルタイム進捗表示
 * - 音声入力統合
 * - 自動遷移機能
 */
export const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  onOcrComplete,
  onVoiceInput,
  disabled = false,
  className = '',
  autoNavigate = true,
  showVoiceInput = true
}) => {
  const [ocrState, setOcrState] = useState<OcrState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    result: null
  });

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 進捗コールバック
  const handleProgress = useCallback((progress: number, stage: string) => {
    setOcrState(prev => ({
      ...prev,
      progress,
      stage
    }));
  }, []);

  // ファイル選択処理
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // ファイルタイプチェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setOcrState(prev => ({
        ...prev,
        error: 'サポートされていないファイル形式です。JPEG、PNG、WebP、PDFを選択してください。'
      }));
      return;
    }

    // ファイルサイズチェック（50MB制限）
    if (file.size > 50 * 1024 * 1024) {
      setOcrState(prev => ({
        ...prev,
        error: 'ファイルサイズが大きすぎます。50MB以下のファイルを選択してください。'
      }));
      return;
    }

    setSelectedFile(file);
    setOcrState(prev => ({ ...prev, error: null }));

    // プレビュー生成
    if (file.type === 'application/pdf') {
      setPreviewUrl('/pdf-icon.png'); // PDFアイコンを表示
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // 自動OCR開始
    if (autoNavigate) {
      await startOcr(file);
    }
  }, [autoNavigate]);

  // OCR処理開始
  const startOcr = useCallback(async (file: File) => {
    if (ocrState.isProcessing) return;

    setOcrState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      stage: '準備中...',
      error: null,
      result: null
    }));

    try {
      const result = await recognizeReceipt(file, handleProgress);
      
      setOcrState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        stage: '完了',
        result
      }));

      // 結果が妥当な場合は自動でコールバック実行
      if (result.date || result.amount) {
        onOcrComplete(result);
      }

    } catch (error) {
      console.error('OCR処理に失敗:', error);
      
      setOcrState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'OCR処理に失敗しました'
      }));
    }
  }, [ocrState.isProcessing, onOcrComplete]);

  // 手動OCR開始
  const handleManualOcr = useCallback(() => {
    if (selectedFile) {
      startOcr(selectedFile);
    }
  }, [selectedFile, startOcr]);

  // ファイル再選択
  const handleRetry = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrState({
      isProcessing: false,
      progress: 0,
      stage: '',
      error: null,
      result: null
    });
  }, []);

  // ドラッグ&ドロップ処理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // ファイル入力クリック
  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ファイル入力変更
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 音声入力結果処理
  const handleVoiceResult = useCallback((result: { date?: string; amount?: number; transcript: string; confidence: number }) => {
    onVoiceInput(result);
  }, [onVoiceInput]);

  // ステップ表示の取得
  const getStepDisplay = () => {
    if (ocrState.isProcessing) {
      const steps = [
        { name: '画像読込', completed: true },
        { name: '前処理', completed: ocrState.progress >= 20 },
        { name: 'OCR中', completed: ocrState.progress >= 60 },
        { name: '結果整形', completed: ocrState.progress >= 90 },
        { name: '完了', completed: ocrState.progress >= 100 }
      ];

      return (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">処理状況</span>
            <span className="text-sm text-gray-500">{Math.round(ocrState.progress)}%</span>
          </div>
          <div className="flex space-x-1">
            {steps.map((step, index) => (
              <div key={index} className="flex-1">
                <div className={`h-2 rounded-full transition-all duration-300 ${
                  step.completed ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
                <div className={`text-xs mt-1 text-center ${
                  step.completed ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // エラーメッセージの取得
  const getErrorMessage = () => {
    if (!ocrState.error) return null;

    const errorHints = [
      '明るい場所で撮影してください',
      'レシートが枠内に収まるようにしてください',
      '影や反射を避けてください',
      'カメラを安定させてください',
      'もう一度撮影してみてください'
    ];

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">OCR処理に失敗しました</h4>
            <p className="mt-1 text-sm text-red-700">{ocrState.error}</p>
            <div className="mt-3">
              <p className="text-xs font-medium text-red-700 mb-2">改善のヒント:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {errorHints.map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleRetry}
              className="mt-3 text-red-600 hover:text-red-800 text-sm underline"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 結果表示の取得
  const getResultDisplay = () => {
    if (!ocrState.result) return null;

    const { date, amount, confidence, processingTime } = ocrState.result;

    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-800">OCR処理が完了しました</h4>
            <div className="mt-2 space-y-1 text-sm">
              {date && (
                <div className="flex justify-between">
                  <span className="text-green-700">日付:</span>
                  <span className="text-green-800 font-medium">{date}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span className="text-green-700">金額:</span>
                  <span className="text-green-800 font-medium">
                    ¥{amount.toLocaleString('ja-JP')}
                  </span>
                </div>
              )}
              {confidence && (
                <div className="flex justify-between">
                  <span className="text-green-700">信頼度:</span>
                  <span className="text-green-600 font-medium">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
              {processingTime && (
                <div className="flex justify-between">
                  <span className="text-green-700">処理時間:</span>
                  <span className="text-green-600 font-medium">
                    {processingTime}ms
                  </span>
                </div>
              )}
            </div>
            {autoNavigate && (date || amount) && (
              <div className="mt-3 p-2 bg-green-100 rounded">
                <p className="text-green-800 text-xs">
                  ✓ データ入力画面に自動遷移しました
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ファイルアップロードエリア */}
      <div
        ref={dropZoneRef}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleFileInputClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={disabled}
              >
                ファイルを選択
              </button>
              <p className="mt-2 text-sm text-gray-600">
                または、ここにファイルをドラッグ&ドロップ
              </p>
              <p className="mt-1 text-xs text-gray-500">
                対応形式: JPEG, PNG, WebP, PDF (最大50MB)
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="h-16 w-16 object-cover rounded"
                />
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {!ocrState.isProcessing && !ocrState.result && (
                <button
                  type="button"
                  onClick={handleManualOcr}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={disabled}
                >
                  OCR処理開始
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {/* 進捗表示 */}
      {getStepDisplay()}

      {/* エラーメッセージ */}
      {getErrorMessage()}

      {/* 結果表示 */}
      {getResultDisplay()}

      {/* 音声入力 */}
      {showVoiceInput && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">音声で入力</h3>
          <p className="text-sm text-gray-600 mb-4">
            OCRで抽出できなかった日付や金額を音声で入力できます
          </p>
          <VoiceInputButton
            onResult={handleVoiceResult}
            onError={(error) => console.error('音声入力エラー:', error)}
            disabled={disabled}
            placeholder="長押しで録音開始"
            timeout={30000}
            vadTimeout={3000}
          />
        </div>
      )}
    </div>
  );
}; 
