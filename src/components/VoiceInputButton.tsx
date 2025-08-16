'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createSpeechRecognizer, SpeechRecognitionState } from '@/lib/speech/recognizer';
import { parseSpeechResult, evaluateSpeechQuality, generateImprovementHints } from '@/lib/speech/parseJa';
import { createServerSttClient } from '@/lib/speech/serverStt';
import { SpeechRecognitionResult, VoiceInputResult } from '@/types';

// 音声入力の状態
interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  audioLevel: number;
  isSpeaking: boolean;
}

// 音声入力の結果（型定義は@/typesからインポート）

// プロパティ
interface VoiceInputButtonProps {
  onResult: (result: VoiceInputResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  timeout?: number;
  vadTimeout?: number;
}

/**
 * 音声入力ボタンコンポーネント
 * - 長押し録音
 * - 音声レベルメーター
 * - 結果プレビュー
 * - 自動フォールバック
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onResult,
  onError,
  disabled = false,
  className = '',
  placeholder = '音声で入力',
  timeout = 30000,
  vadTimeout = 3000
}) => {
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    audioLevel: 0,
    isSpeaking: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [parsedResult, setParsedResult] = useState<VoiceInputResult | null>(null);
  
  const recognizerRef = useRef<any>(null);
  const serverClientRef = useRef<any>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressedRef = useRef(false);

  // 音声認識の初期化
  useEffect(() => {
    try {
      recognizerRef.current = createSpeechRecognizer({
        language: 'ja-JP',
        timeout,
        vadTimeout,
        continuous: false,
        interimResults: true
      }, {
        onStart: () => {
          setState(prev => ({ ...prev, isRecording: true, error: null }));
        },
                 onResult: (result: SpeechRecognitionResult) => {
           if (result.isFinal) {
             handleFinalResult(result.transcript, result.confidence);
           } else {
             setState(prev => ({ ...prev, transcript: result.transcript }));
           }
         },
         onInterimResult: (result: SpeechRecognitionResult) => {
           setState(prev => ({ ...prev, transcript: result.transcript }));
         },
        onEnd: () => {
          setState(prev => ({ ...prev, isRecording: false }));
          stopAudioLevelMonitoring();
        },
        onError: (error: string) => {
          handleError(error);
        },
        onTimeout: () => {
          handleError('録音がタイムアウトしました');
        },
        onVadTimeout: () => {
          handleError('無音が続いたため録音を停止しました');
        }
      });

      // サーバーSTTクライアントも初期化
      serverClientRef.current = createServerSttClient({
        endpoint: '/api/stt',
        timeout: 30000,
        language: 'ja-JP',
        format: 'webm'
      });

    } catch (error) {
      console.error('音声認識の初期化に失敗:', error);
      handleError('音声認識の初期化に失敗しました');
    }

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.destroy();
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, [timeout, vadTimeout]);

  // 音声レベル監視の開始
  const startAudioLevelMonitoring = useCallback(async () => {
    if (recognizerRef.current) {
      try {
        await recognizerRef.current.startAudioLevelMonitoring();
        
        audioLevelIntervalRef.current = setInterval(() => {
          if (recognizerRef.current) {
            const levelInfo = recognizerRef.current.getAudioLevel();
            setState(prev => ({
              ...prev,
              audioLevel: levelInfo.level,
              isSpeaking: levelInfo.isSpeaking
            }));
          }
        }, 100);
      } catch (error) {
        console.warn('音声レベル監視の開始に失敗:', error);
      }
    }
  }, []);

  // 音声レベル監視の停止
  const stopAudioLevelMonitoring = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    if (recognizerRef.current) {
      recognizerRef.current.stopAudioLevelMonitoring();
    }
    
    setState(prev => ({ ...prev, audioLevel: 0, isSpeaking: false }));
  }, []);

  // 最終結果の処理
  const handleFinalResult = useCallback((transcript: string, confidence: number) => {
    setState(prev => ({
      ...prev,
      transcript,
      confidence,
      isProcessing: true
    }));

    // 音声認識結果を解析
    const parsed = parseSpeechResult(transcript);
    setParsedResult(parsed);

    // 品質評価
    const quality = evaluateSpeechQuality(transcript);
    
    if (quality.quality === 'high' && parsed.date && parsed.amount) {
      // 高品質で日付・金額が両方抽出された場合は自動適用
      onResult(parsed);
      setShowPreview(false);
      setState(prev => ({ ...prev, isProcessing: false }));
    } else {
      // プレビュー表示
      setShowPreview(true);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [onResult]);

  // エラーハンドリング
  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isRecording: false,
      isProcessing: false
    }));
    
    onError?.(error);
    stopAudioLevelMonitoring();
  }, [onError, stopAudioLevelMonitoring]);

  // 長押し開始
  const handleMouseDown = useCallback(() => {
    if (disabled || state.isRecording) return;

    isLongPressedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressedRef.current = true;
      startRecording();
    }, 300); // 300msで長押し判定
  }, [disabled, state.isRecording]);

  // 長押し終了
  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressedRef.current && state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording]);

  // タッチイベント対応
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // 録音開始
  const startRecording = useCallback(async () => {
    if (!recognizerRef.current) {
      handleError('音声認識が利用できません');
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, transcript: '' }));
      await recognizerRef.current.start();
      startAudioLevelMonitoring();
    } catch (error) {
      console.error('録音開始に失敗:', error);
      
      // ローカル認識が失敗した場合はサーバーSTTを試行
      if (serverClientRef.current) {
        try {
          setState(prev => ({ ...prev, isProcessing: true }));
          // サーバーSTTの実装（実際の録音データが必要）
          handleError('音声認識に失敗しました。サーバーSTTも利用できません。');
        } catch (serverError) {
          handleError('音声認識に失敗しました');
        }
      } else {
        handleError('音声認識に失敗しました');
      }
    }
  }, [startAudioLevelMonitoring, handleError]);

  // 録音停止
  const stopRecording = useCallback(() => {
    if (recognizerRef.current && state.isRecording) {
      recognizerRef.current.stop();
    }
  }, [state.isRecording]);

  // 結果の適用
  const applyResult = useCallback(() => {
    if (parsedResult) {
      onResult(parsedResult);
      setShowPreview(false);
      setParsedResult(null);
      setState(prev => ({ ...prev, transcript: '', confidence: 0 }));
    }
  }, [parsedResult, onResult]);

  // 結果の破棄
  const discardResult = useCallback(() => {
    setShowPreview(false);
    setParsedResult(null);
    setState(prev => ({ ...prev, transcript: '', confidence: 0 }));
  }, []);

  // 再録音
  const retryRecording = useCallback(() => {
    discardResult();
    startRecording();
  }, [discardResult, startRecording]);

  // ボタンの状態に基づくスタイル
  const getButtonStyle = () => {
    if (state.isRecording) {
      return 'bg-red-500 hover:bg-red-600 text-white';
    } else if (state.isProcessing) {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    } else if (state.error) {
      return 'bg-gray-400 hover:bg-gray-500 text-white';
    } else {
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  // 音声レベルメーターのスタイル
  const getLevelMeterStyle = () => {
    const level = Math.min(100, state.audioLevel * 100);
    return {
      width: `${level}%`,
      backgroundColor: state.isSpeaking ? '#10B981' : '#3B82F6'
    };
  };

  return (
    <div className={`relative ${className}`}>
      {/* メインボタン */}
      <button
        className={`relative px-6 py-3 rounded-lg font-medium transition-all duration-200 
                   ${getButtonStyle()} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                   ${state.isRecording ? 'scale-105 shadow-lg' : 'scale-100'}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
      >
        {/* アイコン */}
        <div className="flex items-center space-x-2">
          {state.isRecording ? (
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          ) : state.isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          
          <span>
            {state.isRecording ? '録音中...' : 
             state.isProcessing ? '処理中...' : 
             state.error ? 'エラー' : placeholder}
          </span>
        </div>

        {/* 音声レベルメーター */}
        {state.isRecording && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full transition-all duration-100 ease-out"
              style={getLevelMeterStyle()}
            />
          </div>
        )}
      </button>

      {/* エラーメッセージ */}
      {state.error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm">{state.error}</p>
          <button
            onClick={retryRecording}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* 結果プレビュー */}
      {showPreview && parsedResult && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">認識結果</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">音声:</span>
              <span className="text-gray-900">{parsedResult.transcript}</span>
            </div>
            
            {parsedResult.date && (
              <div className="flex justify-between">
                <span className="text-gray-600">日付:</span>
                <span className="text-green-600 font-medium">{parsedResult.date}</span>
              </div>
            )}
            
            {parsedResult.amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">金額:</span>
                <span className="text-green-600 font-medium">
                  ¥{parsedResult.amount.toLocaleString('ja-JP')}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">信頼度:</span>
              <span className={`font-medium ${
                parsedResult.confidence >= 0.8 ? 'text-green-600' :
                parsedResult.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(parsedResult.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* 品質評価とヒント */}
          {parsedResult.confidence < 0.8 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-xs mb-1">改善のヒント:</p>
              <ul className="text-yellow-700 text-xs space-y-1">
                {generateImprovementHints(parsedResult.transcript).map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* アクションボタン */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={applyResult}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              適用
            </button>
            <button
              onClick={retryRecording}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              再録音
            </button>
            <button
              onClick={discardResult}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              破棄
            </button>
          </div>
        </div>
      )}

      {/* 一時的な結果表示 */}
      {state.transcript && !showPreview && !state.isRecording && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          認識中: {state.transcript}
        </div>
      )}
    </div>
  );
};
