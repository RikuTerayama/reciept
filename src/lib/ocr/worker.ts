import { createWorker, PSM, Worker, RecognizeResult } from 'tesseract.js';

// 進捗コールバックの型定義
export type ProgressCallback = (progress: number, stage: string) => void;

// OCRステージの定義
export enum OcrStage {
  INITIALIZING = 'initializing',
  LOADING_LANGUAGE = 'loading_language',
  INITIALIZING_TESSERACT = 'initializing_tesseract',
  PROCESSING_IMAGE = 'processing_image',
  EXTRACTING_TEXT = 'extracting_text',
  POST_PROCESSING = 'post_processing',
  COMPLETED = 'completed'
}

// ワーカーの状態
export interface WorkerState {
  isInitialized: boolean;
  isProcessing: boolean;
  currentStage: OcrStage;
  progress: number;
}

// シングルトンワーカー
class TesseractWorkerManager {
  private static instance: TesseractWorkerManager;
  private worker: any = null;
  private isInitializing = false;
  private progressCallback: ProgressCallback | null = null;
  private state: WorkerState = {
    isInitialized: false,
    isProcessing: false,
    currentStage: OcrStage.INITIALIZING,
    progress: 0
  };

  private constructor() {}

  public static getInstance(): TesseractWorkerManager {
    if (!TesseractWorkerManager.instance) {
      TesseractWorkerManager.instance = new TesseractWorkerManager();
    }
    return TesseractWorkerManager.instance;
  }

  /**
   * 進捗コールバックを設定
   */
  public setProgressCallback(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * 現在の状態を取得
   */
  public getState(): WorkerState {
    return { ...this.state };
  }

  /**
   * ワーカーを初期化
   */
  public async initialize(): Promise<Worker> {
    if (this.worker && this.state.isInitialized) {
      return this.worker;
    }

    if (this.isInitializing) {
      // 初期化中の場合は完了を待つ
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.worker!;
    }

    this.isInitializing = true;
    this.updateProgress(0, OcrStage.INITIALIZING);

    try {
      // ワーカーを作成
      this.worker = await createWorker({
        logger: (m) => this.handleWorkerLog(m)
      });

      this.updateProgress(20, OcrStage.LOADING_LANGUAGE);
      
      // 日本語+英語の言語をロード
      await this.worker.loadLanguage('jpn+eng');
      
      this.updateProgress(40, OcrStage.INITIALIZING_TESSERACT);
      
      // Tesseractを初期化
      await this.worker.initialize('jpn+eng');
      
      // 基本パラメータを設定
      await this.worker.setParameters({
        tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK), // PSM 6
        preserve_interword_spaces: '1',
        tessedit_do_invert: '0',
        tessedit_char_whitelist: '0123456789./:-¥$.,ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン年月日時分秒合計小計税抜税込'
      });

      this.state.isInitialized = true;
      this.updateProgress(100, OcrStage.COMPLETED);
      
      return this.worker;
      
    } catch (error) {
      console.error('Tesseract worker initialization failed:', error);
      this.worker = null;
      this.state.isInitialized = false;
      throw new Error(`OCRエンジンの初期化に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * ワーカーのログを処理
   */
  private handleWorkerLog(message: any): void {
    if (this.progressCallback && message.status) {
      let progress = 0;
      let stage = OcrStage.PROCESSING_IMAGE;

      switch (message.status) {
        case 'loading tesseract core':
          progress = 10;
          stage = OcrStage.INITIALIZING;
          break;
        case 'loading language traineddata':
          progress = 30;
          stage = OcrStage.LOADING_LANGUAGE;
          break;
        case 'initializing tesseract':
          progress = 50;
          stage = OcrStage.INITIALIZING_TESSERACT;
          break;
        case 'recognizing text':
          progress = 60 + (message.progress || 0) * 0.3; // 60-90%
          stage = OcrStage.EXTRACTING_TEXT;
          break;
        case 'done':
          progress = 90;
          stage = OcrStage.POST_PROCESSING;
          break;
      }

      this.updateProgress(progress, stage);
    }
  }

  /**
   * 進捗を更新
   */
  private updateProgress(progress: number, stage: OcrStage): void {
    this.state.progress = Math.min(100, Math.max(0, progress));
    this.state.currentStage = stage;
    
    if (this.progressCallback) {
      this.progressCallback(this.state.progress, stage);
    }
  }

  /**
   * 画像認識を実行
   */
  public async recognize(
    canvas: HTMLCanvasElement,
    options: RecognitionOptions = {}
  ): Promise<RecognizeResult> {
    if (!this.worker || !this.state.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCRワーカーの初期化に失敗しました');
    }

    this.state.isProcessing = true;
    this.updateProgress(60, OcrStage.PROCESSING_IMAGE);

    try {
      // 認識オプションを設定
      const recognitionOptions: any = {
        tessedit_pageseg_mode: String(options.psm || PSM.SINGLE_BLOCK)
      };

      // 文字ホワイトリストが指定されている場合は設定
      if (options.characterWhitelist) {
        recognitionOptions.tessedit_char_whitelist = options.characterWhitelist;
      }

      // パラメータを適用
      if (Object.keys(recognitionOptions).length > 0) {
        await this.worker.setParameters(recognitionOptions);
      }

      this.updateProgress(70, OcrStage.EXTRACTING_TEXT);

      // 画像認識を実行
      const result = await this.worker.recognize(canvas);
      
      this.updateProgress(100, OcrStage.COMPLETED);
      
      return result;
      
    } catch (error) {
      console.error('OCR recognition failed:', error);
      throw new Error(`画像認識に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * ワーカーを終了
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.state.isInitialized = false;
    }
  }

  /**
   * ワーカーをリセット
   */
  public async reset(): Promise<void> {
    await this.terminate();
    this.state = {
      isInitialized: false,
      isProcessing: false,
      currentStage: OcrStage.INITIALIZING,
      progress: 0
    };
  }
}

// 認識オプション
export interface RecognitionOptions {
  psm?: typeof PSM;
  characterWhitelist?: string;
}

// シングルトンインスタンスをエクスポート
export const workerManager = TesseractWorkerManager.getInstance();

// 便利な関数をエクスポート
export const getWorker = () => workerManager.initialize();
export const setProgressCallback = (callback: ProgressCallback) => workerManager.setProgressCallback(callback);
export const getWorkerState = () => workerManager.getState();
export const terminateWorker = () => workerManager.terminate();
export const resetWorker = () => workerManager.reset();
