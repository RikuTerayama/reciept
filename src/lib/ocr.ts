// src/lib/ocr.ts
// 新しいOCR実装のエントリーポイント
export * from './ocr/index';

// 既存の関数との互換性を保つ
export const getOcrWorker = async () => {
  const { getWorker } = await import('./ocr/worker');
  return getWorker();
};

export const setOcrProgressHandler = (cb: (m: any) => void) => {
  // 新しい実装では進捗はrecognizeReceiptのコールバックで処理
  console.warn('setOcrProgressHandler is deprecated. Use recognizeReceipt with onProgress callback instead.');
};
