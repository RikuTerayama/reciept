// サーバーSTTの設定
export interface ServerSttConfig {
  endpoint: string;
  timeout: number;
  language: string;
  format: 'wav' | 'webm' | 'mp3';
}

// サーバーSTTの結果
export interface ServerSttResult {
  transcript: string;
  confidence: number;
  alternatives?: string[];
  processingTime: number;
}

// サーバーSTTのエラー
export interface ServerSttError {
  code: string;
  message: string;
  details?: any;
}

/**
 * サーバーSTTクライアント
 * Web Speech APIが非対応の場合のフォールバック
 */
export class ServerSttClient {
  private config: ServerSttConfig;
  private isProcessing: boolean = false;

  constructor(config: Partial<ServerSttConfig> = {}) {
    this.config = {
      endpoint: '/api/stt', // デフォルトエンドポイント
      timeout: 30000, // 30秒
      language: 'ja-JP',
      format: 'webm',
      ...config
    };
  }

  /**
   * 音声データをサーバーに送信してSTT実行
   */
  public async transcribe(audioBlob: Blob): Promise<ServerSttResult> {
    if (this.isProcessing) {
      throw new Error('既に処理中のリクエストがあります');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // 音声データを適切な形式に変換
      const processedBlob = await this.preprocessAudio(audioBlob);
      
      // FormDataを作成
      const formData = new FormData();
      formData.append('audio', processedBlob, `recording.${this.config.format}`);
      formData.append('language', this.config.language);
      formData.append('format', this.config.format);

      // サーバーにリクエスト送信
      const response = await this.sendRequest(formData);
      
      const processingTime = Date.now() - startTime;
      
      return {
        transcript: response.transcript || '',
        confidence: response.confidence || 0,
        alternatives: response.alternatives || [],
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof ServerSttError) {
        throw error;
      }
      
      throw new ServerSttError(
        'TRANSCRIPTION_FAILED',
        `音声認識に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        { processingTime }
      );
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 音声データの前処理
   */
  private async preprocessAudio(audioBlob: Blob): Promise<Blob> {
    // 既に適切な形式の場合はそのまま返す
    if (audioBlob.type.includes(this.config.format)) {
      return audioBlob;
    }

    // 必要に応じて形式変換
    try {
      switch (this.config.format) {
        case 'wav':
          return await this.convertToWav(audioBlob);
        case 'webm':
          return await this.convertToWebm(audioBlob);
        case 'mp3':
          return await this.convertToMp3(audioBlob);
        default:
          return audioBlob;
      }
    } catch (error) {
      console.warn('音声形式変換に失敗、元の形式で送信:', error);
      return audioBlob;
    }
  }

  /**
   * WAV形式に変換
   */
  private async convertToWav(audioBlob: Blob): Promise<Blob> {
    // 簡易的なWAV変換（実際の実装ではより高度な変換が必要）
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // WAVヘッダーを作成
    const wavHeader = this.createWavHeader(audioBuffer);
    const wavData = this.audioBufferToWav(audioBuffer);
    
    const wavArray = new Uint8Array(wavHeader.length + wavData.length);
    wavArray.set(wavHeader);
    wavArray.set(wavData, wavHeader.length);
    
    return new Blob([wavArray], { type: 'audio/wav' });
  }

  /**
   * WebM形式に変換
   */
  private async convertToWebm(audioBlob: Blob): Promise<Blob> {
    // MediaRecorderを使用してWebMに変換
    return new Promise((resolve, reject) => {
      const stream = new MediaStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const webmBlob = new Blob(chunks, { type: 'audio/webm' });
        resolve(webmBlob);
      };
      
      mediaRecorder.onerror = reject;
      
      // 音声データを再生して録音
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      audio.play();
    });
  }

  /**
   * MP3形式に変換
   */
  private async convertToMp3(audioBlob: Blob): Promise<Blob> {
    // MP3変換は複雑なため、元の形式で送信
    console.warn('MP3変換はサポートされていません。元の形式で送信します。');
    return audioBlob;
  }

  /**
   * WAVヘッダーを作成
   */
  private createWavHeader(audioBuffer: AudioBuffer): Uint8Array {
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
    const blockAlign = numberOfChannels * bitsPerSample / 8;
    const dataSize = audioBuffer.length * numberOfChannels * bitsPerSample / 8;
    
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFFヘッダー
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true); // ファイルサイズ
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmtチャンク
    view.setUint32(12, 0x666D7420, false); // "fmt "
    view.setUint32(16, 16, true); // fmtチャンクサイズ
    view.setUint16(20, 1, true); // PCM形式
    view.setUint16(22, numberOfChannels, true); // チャンネル数
    view.setUint32(24, sampleRate, true); // サンプルレート
    view.setUint32(28, byteRate, true); // バイトレート
    view.setUint16(32, blockAlign, true); // ブロックアライメント
    view.setUint16(34, bitsPerSample, true); // ビット深度
    
    // dataチャンク
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true); // データサイズ
    
    return new Uint8Array(header);
  }

  /**
   * AudioBufferをWAVデータに変換
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Uint8Array {
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const data = new Int16Array(length * numberOfChannels);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        data[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
    }
    
    return new Uint8Array(data.buffer);
  }

  /**
   * サーバーにリクエスト送信
   */
  private async sendRequest(formData: FormData): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Content-Typeは自動設定される
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ServerSttError(
          'HTTP_ERROR',
          `HTTPエラー: ${response.status} ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }

      const result = await response.json();
      
      if (!result.transcript) {
        throw new ServerSttError(
          'INVALID_RESPONSE',
          'サーバーからの応答が無効です',
          { response: result }
        );
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ServerSttError(
          'TIMEOUT',
          'リクエストがタイムアウトしました',
          { timeout: this.config.timeout }
        );
      }
      
      throw error;
    }
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: Partial<ServerSttConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): ServerSttConfig {
    return { ...this.config };
  }

  /**
   * 処理中かどうかを取得
   */
  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

/**
 * サーバーSTTクライアントのファクトリー関数
 */
export const createServerSttClient = (config?: Partial<ServerSttConfig>): ServerSttClient => {
  return new ServerSttClient(config);
};

/**
 * 音声認識のフォールバック戦略
 */
export class SpeechRecognitionFallback {
  private localRecognizer: any; // Web Speech API
  private serverClient: ServerSttClient;
  private fallbackEnabled: boolean = true;

  constructor(
    localRecognizer: any,
    serverConfig?: Partial<ServerSttConfig>
  ) {
    this.localRecognizer = localRecognizer;
    this.serverClient = createServerSttClient(serverConfig);
  }

  /**
   * 音声認識を実行（フォールバック付き）
   */
  public async recognize(audioBlob: Blob): Promise<ServerSttResult> {
    // まずローカル認識を試行
    if (this.localRecognizer && this.localRecognizer.isSupported()) {
      try {
        return await this.tryLocalRecognition(audioBlob);
      } catch (error) {
        console.warn('ローカル音声認識に失敗、サーバーSTTにフォールバック:', error);
      }
    }

    // ローカル認識が失敗または非対応の場合はサーバーSTT
    if (this.fallbackEnabled) {
      return await this.serverClient.transcribe(audioBlob);
    }

    throw new Error('音声認識が利用できません');
  }

  /**
   * ローカル音声認識を試行
   */
  private async tryLocalRecognition(audioBlob: Blob): Promise<ServerSttResult> {
    // ローカル認識の実装（実際のWeb Speech APIとの連携が必要）
    throw new Error('ローカル音声認識は実装されていません');
  }

  /**
   * フォールバックを有効/無効にする
   */
  public setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  /**
   * サーバーSTTクライアントを取得
   */
  public getServerClient(): ServerSttClient {
    return this.serverClient;
  }
}

// カスタムエラークラス
export class ServerSttError extends Error {
  public code: string;
  public details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ServerSttError';
    this.code = code;
    this.details = details;
  }
}
