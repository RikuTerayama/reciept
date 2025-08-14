'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../lib/speech/recognizer';
import { parseSpeechResult } from '../lib/speech/parseJa';

interface VoiceInputProps {
  onComplete: (result: { date?: string; amount?: number; transcript: string }) => void;
  onCancel: () => void;
}

export default function VoiceInput({ onComplete, onCancel }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognizerRef = useRef<any>(null);

  // 音声認識のサポートチェック
  const isSupported = isSpeechRecognitionSupported();

  // 録音開始
  const startVoiceInput = useCallback(async () => {
    try {
      setError(null);
      setIsRecording(true);
      setTranscript('');
      
      if (isSupported) {
        const recognizer = createSpeechRecognizer(
          {
            language: 'ja-JP',
            interimResults: true,
            continuous: false
          },
          {
            onResult: (result) => {
              if (result.isFinal) {
                setTranscript(result.transcript);
                setIsRecording(false);
                handleFinalResult(result.transcript);
              } else {
                setTranscript(result.transcript);
              }
            },
            onError: (error) => {
              setError(`音声認識エラー: ${error}`);
              setIsRecording(false);
            }
          }
        );
        
        recognizerRef.current = recognizer;
        
        recognizer.start();
      } else {
        setError('この端末は音声認識に対応していません');
        setIsRecording(false);
      }
    } catch (error) {
      setError(`録音開始エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setIsRecording(false);
    }
  }, [isSupported]);

  // 録音停止
  const stopVoiceInput = useCallback(() => {
    setIsRecording(false);
    
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
  }, []);

  // 音声認識結果の処理
  const handleFinalResult = useCallback(async (finalTranscript: string) => {
    try {
      setIsProcessing(true);
      
      const result = parseSpeechResult(finalTranscript);
      
      if (result.date || result.amount) {
        onComplete({
          date: result.date,
          amount: result.amount,
          transcript: finalTranscript
        });
      } else {
        setError('日付または金額が認識できませんでした。もう一度お試しください。');
      }
    } catch (error) {
      setError(`結果処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onComplete]);

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <MicOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">音声入力がサポートされていません</h3>
            <p className="text-gray-600 mb-4">
              この端末は音声入力に対応していません。
            </p>
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">音声入力</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          {isRecording ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-10 h-10 text-white" />
              </div>
              
              <p className="text-sm text-gray-600">
                話してください... タップして停止
              </p>
              
              <button
                onClick={stopVoiceInput}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                停止
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Mic className="w-10 h-10 text-white" />
              </div>
              
              <p className="text-sm text-gray-600">
                タップして録音開始
              </p>
              
              <button
                onClick={startVoiceInput}
                disabled={isProcessing}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? '処理中...' : '録音開始'}
              </button>
            </div>
          )}
        </div>

        {/* 結果表示 */}
        {transcript && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-700">
              <strong>認識結果:</strong> {transcript}
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 手動入力フォールバック */}
        {!isRecording && !isProcessing && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              手動入力に切り替え
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
