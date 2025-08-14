// Web Speech APIの型定義
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// 音声認識の状態
export enum SpeechRecognitionState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 音声認識の設定
export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number; // タイムアウト（ミリ秒）
  vadTimeout?: number; // 無音検出タイムアウト（ミリ秒）
}

// 音声認識の結果
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

// 音声認識のイベント
export interface SpeechRecognitionEvents {
  onStart?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onInterimResult?: (result: SpeechRecognitionResult) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
  onVadTimeout?: () => void;
}

// 音声レベル情報
export interface AudioLevelInfo {
  level: number; // 0-1
  isSpeaking: boolean;
}

/**
 * Web Speech API音声認識クラス
 */
export class SpeechRecognizer {
  private recognition: any;
  private isSupported: boolean;
  private state: SpeechRecognitionState = SpeechRecognitionState.IDLE;
  private config: SpeechRecognitionConfig;
  private events: SpeechRecognitionEvents;
  private timeoutId?: NodeJS.Timeout;
  private vadTimeoutId?: NodeJS.Timeout;
  private lastSpeechTime: number = 0;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private microphone?: MediaStreamAudioSourceNode;
  private stream?: MediaStream;

  constructor(config: SpeechRecognitionConfig = {}, events: SpeechRecognitionEvents = {}) {
    this.config = {
      language: 'ja-JP',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      timeout: 30000, // 30秒
      vadTimeout: 3000, // 3秒
      ...config
    };
    
    this.events = events;
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeRecognition();
    }
  }

  /**
   * Web Speech APIのサポートチェック
   */
  private checkSupport(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * 音声認識を初期化
   */
  private initializeRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    this.recognition = new SpeechRecognition();
    
    // 基本設定
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    
    // イベントハンドラーを設定
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーを設定
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.state = SpeechRecognitionState.LISTENING;
      this.startTimeout();
      this.startVADTimeout();
      this.events.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      this.resetVADTimeout();
      
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      
      const recognitionResult: SpeechRecognitionResult = {
        transcript,
        confidence,
        isFinal,
        alternatives: Array.from(result).map((alt: any) => alt.transcript)
      };

      if (isFinal) {
        this.state = SpeechRecognitionState.COMPLETED;
        this.events.onResult?.(recognitionResult);
      } else {
        this.events.onInterimResult?.(recognitionResult);
      }
    };

    this.recognition.onend = () => {
      this.state = SpeechRecognitionState.IDLE;
      this.clearTimeouts();
      this.events.onEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      this.state = SpeechRecognitionState.ERROR;
      this.clearTimeouts();
      
      let errorMessage = '音声認識でエラーが発生しました';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '音声が検出されませんでした';
          break;
        case 'audio-capture':
          errorMessage = 'マイクへのアクセスに失敗しました';
          break;
        case 'not-allowed':
          errorMessage = 'マイクの使用が許可されていません';
          break;
        case 'network':
          errorMessage = 'ネットワークエラーが発生しました';
          break;
        case 'service-not-allowed':
          errorMessage = '音声認識サービスが利用できません';
          break;
        case 'bad-grammar':
          errorMessage = '文法エラーが発生しました';
          break;
        case 'language-not-supported':
          errorMessage = 'この言語はサポートされていません';
          break;
      }
      
      this.events.onError?.(errorMessage);
    };
  }

  /**
   * 音声認識を開始
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('このブラウザは音声認識をサポートしていません'));
        return;
      }

      if (this.state !== SpeechRecognitionState.IDLE) {
        reject(new Error('音声認識は既に実行中です'));
        return;
      }

      try {
        this.recognition.start();
        resolve();
      } catch (error) {
        reject(new Error(`音声認識の開始に失敗しました: ${error}`));
      }
    });
  }

  /**
   * 音声認識を停止
   */
  public stop(): void {
    if (this.recognition && this.state === SpeechRecognitionState.LISTENING) {
      this.recognition.stop();
      this.clearTimeouts();
    }
  }

  /**
   * 音声認識を中止
   */
  public abort(): void {
    if (this.recognition && this.state === SpeechRecognitionState.LISTENING) {
      this.recognition.abort();
      this.clearTimeouts();
    }
  }

  /**
   * タイムアウトを開始
   */
  private startTimeout(): void {
    if (this.config.timeout) {
      this.timeoutId = setTimeout(() => {
        this.events.onTimeout?.();
        this.stop();
      }, this.config.timeout);
    }
  }

  /**
   * VADタイムアウトを開始
   */
  private startVADTimeout(): void {
    if (this.config.vadTimeout) {
      this.vadTimeoutId = setTimeout(() => {
        this.events.onVadTimeout?.();
        this.stop();
      }, this.config.vadTimeout);
    }
  }

  /**
   * VADタイムアウトをリセット
   */
  private resetVADTimeout(): void {
    this.lastSpeechTime = Date.now();
    
    if (this.vadTimeoutId) {
      clearTimeout(this.vadTimeoutId);
      this.startVADTimeout();
    }
  }

  /**
   * タイムアウトをクリア
   */
  private clearTimeouts(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    
    if (this.vadTimeoutId) {
      clearTimeout(this.vadTimeoutId);
      this.vadTimeoutId = undefined;
    }
  }

  /**
   * 音声レベル監視を開始
   */
  public async startAudioLevelMonitoring(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.microphone.connect(this.analyser);
      
    } catch (error) {
      console.warn('音声レベル監視の開始に失敗:', error);
    }
  }

  /**
   * 音声レベルを取得
   */
  public getAudioLevel(): AudioLevelInfo {
    if (!this.analyser) {
      return { level: 0, isSpeaking: false };
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // 音声レベルの計算
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const level = average / 255; // 0-1に正規化
    
    // 発話中かどうかの判定
    const isSpeaking = level > 0.1; // 閾値は調整可能
    
    if (isSpeaking) {
      this.lastSpeechTime = Date.now();
    }
    
    return { level, isSpeaking };
  }

  /**
   * 音声レベル監視を停止
   */
  public stopAudioLevelMonitoring(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
    
    this.analyser = undefined;
    this.microphone = undefined;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): SpeechRecognitionState {
    return this.state;
  }

  /**
   * サポート状況を取得
   */
  public isSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * イベントハンドラーを更新
   */
  public updateEvents(newEvents: SpeechRecognitionEvents): void {
    this.events = { ...this.events, ...newEvents };
  }

  /**
   * リソースをクリーンアップ
   */
  public destroy(): void {
    this.stop();
    this.stopAudioLevelMonitoring();
    this.clearTimeouts();
    
    if (this.recognition) {
      this.recognition = undefined;
    }
  }
}

/**
 * 音声認識のファクトリー関数
 */
export const createSpeechRecognizer = (
  config?: SpeechRecognitionConfig,
  events?: SpeechRecognitionEvents
): SpeechRecognizer => {
  return new SpeechRecognizer(config, events);
};

/**
 * 音声認識のサポートチェック
 */
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * 利用可能な言語を取得
 */
export const getSupportedLanguages = (): string[] => {
  // 主要な言語のリスト（実際のサポート状況はブラウザ依存）
  return [
    'ja-JP', 'en-US', 'en-GB', 'zh-CN', 'zh-TW', 'ko-KR',
    'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU'
  ];
};
