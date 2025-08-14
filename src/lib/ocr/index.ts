import { preprocessImage, PreprocessOptions } from './preprocess';
import { workerManager, setProgressCallback, OcrStage } from './worker';
import { extractROIs, extractROIsFromText, extractCanvasFromROI, sortROIsByPriority } from './roi';
import { postprocessOCRResult } from './postprocess';
import { PSM } from 'tesseract.js';

// OCR結果の型定義
export interface OcrResult {
  rawText: string;
  date?: string;
  amount?: number;
  confidence: number;
  processingTime: number;
  stage: OcrStage;
}

// OCRオプション
export interface OcrOptions extends PreprocessOptions {
  enableTwoPass?: boolean;
  maxROIs?: number;
  enableProgressCallback?: boolean;
}

// 進捗コールバックの型
export type OcrProgressCallback = (progress: number, stage: string) => void;

/**
 * レシート画像を認識
 * - 画像前処理
 * - 2段階認識（全体 + ROI）
 * - 結果の後処理
 */
export const recognizeReceipt = async (
  input: File | Blob | string,
  onProgress?: OcrProgressCallback,
  options: OcrOptions = {}
): Promise<OcrResult> => {
  const startTime = Date.now();
  
  const {
    enableTwoPass = true,
    maxROIs = 5,
    enableProgressCallback = true,
    ...preprocessOptions
  } = options;

  try {
    // 進捗コールバックを設定
    if (enableProgressCallback && onProgress) {
      setProgressCallback(onProgress);
    }

    // 1. 画像前処理
    onProgress?.(10, '前処理中...');
    const preprocessedCanvas = await preprocessImage(input, preprocessOptions);
    onProgress?.(20, '前処理完了');

    // 2. 1段階目：全体認識
    onProgress?.(30, '1段階目認識中...');
    const worker = await workerManager.initialize();
    
    const firstPassResult = await worker.recognize(preprocessedCanvas, {
      psm: PSM.SINGLE_BLOCK
    });
    
    onProgress?.(60, '1段階目完了');

    // 3. ROI抽出
    onProgress?.(65, '関心領域検出中...');
    const rois = extractROIsFromText(
      firstPassResult.data.text || '',
      preprocessedCanvas.width,
      preprocessedCanvas.height
    );
    
    // 優先度順にソートして上位のROIのみ処理
    const sortedROIs = sortROIsByPriority(rois).slice(0, maxROIs);
    onProgress?.(70, `${sortedROIs.length}個の領域を検出`);

    // 4. 2段階目：ROI認識（オプション）
    let roiResults: Array<{ text: string; type: 'amount' | 'date'; confidence: number }> = [];
    
    if (enableTwoPass && sortedROIs.length > 0) {
      onProgress?.(75, '2段階目認識中...');
      
      for (let i = 0; i < sortedROIs.length; i++) {
        const roi = sortedROIs[i];
        const roiCanvas = extractCanvasFromROI(preprocessedCanvas, roi);
        
        try {
          // ROIに特化した認識パラメータ
          const roiResult = await worker.recognize(roiCanvas, {
            psm: PSM.SINGLE_LINE, // 単一行として認識
            characterWhitelist: roi.type === 'amount' 
              ? '0123456789,./:-¥$' 
              : '0123456789年月日時分秒-/.'
          });
          
          roiResults.push({
            text: roiResult.data.text,
            type: roi.type,
            confidence: roi.confidence
          });
          
          onProgress?.(75 + (i + 1) * (20 / sortedROIs.length), `ROI ${i + 1}/${sortedROIs.length} 完了`);
          
        } catch (error) {
          console.warn(`ROI ${i + 1} の認識に失敗:`, error);
          // ROI認識が失敗しても処理を継続
        }
      }
    }

    onProgress?.(95, '結果処理中...');

    // 5. 結果の統合・後処理
    const finalResult = postprocessOCRResult(
      firstPassResult.data.text || '',
      roiResults
    );

    const processingTime = Date.now() - startTime;
    
    onProgress?.(100, '完了');

    return {
      ...finalResult,
      processingTime,
      stage: OcrStage.COMPLETED
    };

  } catch (error) {
    console.error('OCR recognition failed:', error);
    
    // エラー時も進捗を100%にして完了状態にする
    onProgress?.(100, 'エラー');
    
    throw new Error(`レシート認識に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

/**
 * 既存の関数との互換性を保つ
 */
export const processImageWithOCR = async (file: File): Promise<any> => {
  try {
    const result = await recognizeReceipt(file);
    
    return {
      text: result.rawText,
      date: result.date,
      totalAmount: result.amount,
      receiptNumber: '', // 既存の実装に合わせて空文字
      category: '',
      description: '',
      taxRate: 10,
      isQualified: true,
      imageData: await blobToDataURL(file),
      confidence: result.confidence,
      processingTime: result.processingTime
    };
    
  } catch (error) {
    console.error('processImageWithOCR failed:', error);
    throw error;
  }
};

/**
 * BlobをDataURLに変換
 */
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * OCRワーカーの状態を取得
 */
export const getOcrWorkerState = () => workerManager.getState();

/**
 * OCRワーカーをリセット
 */
export const resetOcrWorker = () => workerManager.reset();

/**
 * OCRワーカーを終了
 */
export const terminateOcrWorker = () => workerManager.terminate();

// 既存の関数をエクスポート（互換性のため）
export const getOcrWorker = () => workerManager.initialize();
export const setOcrProgressHandler = (callback: (progress: number, stage: string) => void) => {
  workerManager.setProgressCallback(callback);
};
