'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { createSpeechRecognizer } from '@/lib/voice';
import { parseJaSpeechToDateAmount } from '@/lib/voiceParse';
import { getCurrentLanguage, t, Language } from '@/lib/i18n';
import { useExpenseStore } from '@/lib/store';

interface VoiceInputProps {
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export default function VoiceInput({ onComplete, onCancel }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'guide' | 'listening' | 'processing' | 'result'>('guide');
  const [recognizedText, setRecognizedText] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  
  const currentLanguage = getCurrentLanguage();
  const { setOCRResult } = useExpenseStore();

  // 音声認識の初期化
  useEffect(() => {
    const recognizer = createSpeechRecognizer();
    setSpeechRecognizer(recognizer);
    
    if (!recognizer.supported) {
      setError(t('voice.unsupported', currentLanguage, 'このブラウザは音声入力に対応していません'));
    }
  }, [currentLanguage]);

  // 音声入力の開始
  const startVoiceInput = useCallback(async () => {
    if (!speechRecognizer?.supported) {
      setError(t('voice.unsupported', currentLanguage, 'このブラウザは音声入力に対応していません'));
      return;
    }

    setIsListening(true);
    setCurrentStep('listening');
    setError('');
    setRecognizedText('');
    setExtractedData(null);
    setProgress(0);
    setStepProgress(0);

    try {
      // ステップ別のガイダンス音声（実装可能な場合）
      const stepGuide = getStepGuide(currentLanguage);
      speakGuide(stepGuide.step1);

      // 音声認識開始
      const text = await speechRecognizer.start();
      setRecognizedText(text);
      
      if (text.trim()) {
        setCurrentStep('processing');
        setProgress(50);
        
        // 音声テキストの解析
        const data = parseJaSpeechToDateAmount(text);
        setExtractedData(data);
        setProgress(100);
        
        setCurrentStep('result');
      } else {
        setError(t('voice.noSpeech', currentLanguage, '音声が検出されませんでした'));
        setIsListening(false);
        setCurrentStep('guide');
      }
    } catch (error: any) {
      console.error('Voice recognition error:', error);
      setError(error.message || t('voice.error', currentLanguage, '音声認識でエラーが発生しました'));
      setIsListening(false);
      setCurrentStep('guide');
    }
  }, [speechRecognizer, currentLanguage]);

  // 音声入力の停止
  const stopVoiceInput = useCallback(() => {
    if (speechRecognizer) {
      speechRecognizer.stop();
    }
    setIsListening(false);
    setCurrentStep('guide');
  }, [speechRecognizer]);

  // 結果の適用
  const applyResult = useCallback(() => {
    if (extractedData) {
      // OCR結果と同様の形式でデータを構築
      const voiceResult = {
        date: extractedData.date || new Date().toISOString().split('T')[0],
        totalAmount: extractedData.amount || 0,
        text: recognizedText,
        confidence: 0.9, // 音声入力の信頼度
        source: 'voice' as const
      };

      // ストアに保存
      setOCRResult(voiceResult);
      
      // 完了コールバック
      onComplete(voiceResult);
    }
  }, [extractedData, recognizedText, setOCRResult, onComplete]);

  // 再試行
  const retry = useCallback(() => {
    setCurrentStep('guide');
    setRecognizedText('');
    setExtractedData(null);
    setError('');
    setProgress(0);
  }, []);

  // ステップ別ガイダンス
  const getStepGuide = (lang: Language) => {
    if (lang === 'ja') {
      return {
        step1: 'まず日付を言ってください。例：「2025年8月13日」または「8月13日」',
        step2: '次に金額を言ってください。例：「1万2千円」または「12300円」',
        step3: '必要に応じてカテゴリや説明も言ってください。例：「交通費」または「タクシー代」',
        tips: [
          'ゆっくり、はっきりと話してください',
          '日付は「年月日」の順で言うと認識しやすいです',
          '金額は「円」をつけて言うと確実です',
          '背景音が少ない環境で行ってください'
        ]
      };
    } else {
      return {
        step1: 'First, say the date. Example: "August 13, 2025" or "13th August"',
        step2: 'Next, say the amount. Example: "12,300 yen" or "12,300"',
        step3: 'Optionally, say the category or description. Example: "Transportation" or "Taxi fare"',
        tips: [
          'Speak slowly and clearly',
          'Say the date in "month day year" order for better recognition',
          'Include "yen" when saying amounts for accuracy',
          'Use in a quiet environment'
        ]
      };
    }
  };

  // 音声ガイダンス（Web Speech API使用）
  const speakGuide = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'ja' ? 'ja-JP' : 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // 現在のステップに応じたガイダンス表示
  const renderStepGuide = () => {
    const guide = getStepGuide(currentLanguage);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('voice.guideTitle', currentLanguage, '音声入力ガイド')}
          </h3>
          <p className="text-surface-300 text-sm">
            {t('voice.guideSubtitle', currentLanguage, '以下の順番で音声入力してください')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <h4 className="text-blue-300 font-medium text-sm mb-2">
                {t('voice.step1Title', currentLanguage, '日付')}
              </h4>
              <p className="text-blue-200 text-xs">{guide.step1}</p>
            </div>
          </div>

          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <h4 className="text-green-300 font-medium text-sm mb-2">
                {t('voice.step2Title', currentLanguage, '金額')}
              </h4>
              <p className="text-green-200 text-xs">{guide.step2}</p>
            </div>
          </div>

          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <h4 className="text-purple-300 font-medium text-sm mb-2">
                {t('voice.step3Title', currentLanguage, '詳細')}
              </h4>
              <p className="text-purple-200 text-xs">{guide.step3}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-300 font-medium text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t('voice.tipsTitle', currentLanguage, '音声入力のコツ')}
          </h4>
          <ul className="space-y-2">
            {guide.tips.map((tip, index) => (
              <li key={index} className="text-yellow-200 text-xs flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // 音声入力中の表示
  const renderListening = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Mic className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-blue-400 rounded-full animate-ping opacity-75"></div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('voice.listening', currentLanguage, '聴き取り中...')}
        </h3>
        <p className="text-surface-300 text-sm">
          {t('voice.speakNow', currentLanguage, '今すぐ話してください')}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-center space-x-1">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                stepProgress >= step ? 'bg-blue-500' : 'bg-surface-600'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-surface-400">
          {t('voice.progress', currentLanguage, `ステップ ${Math.min(stepProgress + 1, 3)}/3`)}
        </p>
      </div>

      <button
        onClick={stopVoiceInput}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
      >
        <MicOff className="w-5 h-5 inline mr-2" />
        {t('voice.stop', currentLanguage, '停止')}
      </button>
    </div>
  );

  // 処理中の表示
  const renderProcessing = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-spin">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
      
      <h3 className="text-lg font-semibold text-white">
        {t('voice.processing', currentLanguage, '音声を解析中...')}
      </h3>
      
      <div className="w-full bg-surface-600 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-surface-400 text-sm">
        {Math.round(progress)}% {t('voice.complete', currentLanguage, '完了')}
      </p>
    </div>
  );

  // 結果表示
  const renderResult = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {t('voice.complete', currentLanguage, '音声認識完了')}
        </h3>
      </div>

      <div className="bg-surface-700 rounded-lg p-4 space-y-3">
        <h4 className="text-surface-300 font-medium">
          {t('voice.recognizedText', currentLanguage, '認識された音声')}
        </h4>
        <p className="text-white text-sm bg-surface-800 rounded p-3">
          {recognizedText || t('voice.noText', currentLanguage, '音声が認識されませんでした')}
        </p>
      </div>

      {extractedData && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
          <h4 className="text-green-300 font-medium mb-3">
            {t('voice.extractedData', currentLanguage, '抽出された情報')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractedData.date && (
              <div className="flex items-center gap-2">
                <span className="text-green-400">📅</span>
                <span className="text-green-200 text-sm">
                  {t('voice.date', currentLanguage, '日付')}: {extractedData.date}
                </span>
              </div>
            )}
            {extractedData.amount && (
              <div className="flex items-center gap-2">
                <span className="text-green-400">💰</span>
                <span className="text-green-200 text-sm">
                  {t('voice.amount', currentLanguage, '金額')}: ¥{extractedData.amount.toLocaleString('ja-JP')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={retry}
          className="flex-1 px-6 py-3 bg-surface-600 hover:bg-surface-700 text-white rounded-lg transition-colors font-medium"
        >
          <RotateCcw className="w-5 h-5 inline mr-2" />
          {t('voice.retry', currentLanguage, '再試行')}
        </button>
        <button
          onClick={applyResult}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <CheckCircle className="w-5 h-5 inline mr-2" />
          {t('voice.apply', currentLanguage, '結果を適用')}
        </button>
      </div>
    </div>
  );

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-surface-950 text-surface-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-white">
              {t('voice.errorTitle', currentLanguage, '音声入力エラー')}
            </h2>
            <p className="text-red-400">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={retry}
                className="px-6 py-3 bg-surface-600 hover:bg-surface-700 text-white rounded-lg transition-colors"
              >
                {t('voice.retry', currentLanguage, '再試行')}
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t('voice.cancel', currentLanguage, 'キャンセル')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('voice.title', currentLanguage, '音声入力')}
          </h1>
          <p className="text-surface-400">
            {t('voice.subtitle', currentLanguage, '音声で経費情報を入力してください')}
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-surface-900 rounded-xl p-8">
          {currentStep === 'guide' && (
            <>
              {renderStepGuide()}
              <div className="text-center mt-8">
                <button
                  onClick={startVoiceInput}
                  disabled={!speechRecognizer?.supported}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-surface-600 text-white rounded-lg transition-colors font-medium text-lg"
                >
                  <Mic className="w-6 h-6 inline mr-3" />
                  {t('voice.start', currentLanguage, '音声入力を開始')}
                </button>
              </div>
            </>
          )}

          {currentStep === 'listening' && renderListening()}
          {currentStep === 'processing' && renderProcessing()}
          {currentStep === 'result' && renderResult()}
        </div>

        {/* フッター */}
        <div className="text-center mt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-surface-700 hover:bg-surface-600 text-surface-300 rounded-lg transition-colors"
          >
            {t('voice.cancel', currentLanguage, 'キャンセル')}
          </button>
        </div>
      </div>
    </div>
  );
}
