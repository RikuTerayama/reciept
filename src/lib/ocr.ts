// src/lib/ocr.ts
import { createWorker, PSM } from 'tesseract.js';

// --- ワーカー: シングルトン ---
let _worker: any = null;
export const getOcrWorker = async () => {
  if (_worker) return _worker;
  const worker = await createWorker({
    logger: m => _progressCb?.(m) // 外から進捗受け
  });
  await worker.loadLanguage('jpn+eng');
  await worker.initialize('jpn+eng');
  await worker.setParameters({
    tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK), // psm 6
    tessedit_char_whitelist: '0123456789./:-¥$.,',
    preserve_interword_spaces: '1',
  });
  _worker = worker;
  return worker;
};

// --- 進捗コールバック保持 ---
let _progressCb: ((m: any) => void) | null = null;
export const setOcrProgressHandler = (cb: (m:any)=>void) => { _progressCb = cb; };

// --- PDF処理 ---
const processPdf = async (file: File): Promise<HTMLCanvasElement> => {
  try {
    // PDF.jsの動的インポート
    const pdfjsLib = await import('pdfjs-dist');
    
    // PDF.jsのワーカー設定
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    // PDFファイルを読み込み
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 最初のページを取得
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 }); // スケール1.5でレンダリング
    
    // Canvasを作成
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // ページをCanvasにレンダリング
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // 解像度を適度に制限
    const maxW = 1800;
    if (canvas.width > maxW) {
      const scale = maxW / canvas.width;
      const resizedCanvas = document.createElement('canvas');
      const resizedContext = resizedCanvas.getContext('2d')!;
      resizedCanvas.width = Math.floor(canvas.width * scale);
      resizedCanvas.height = Math.floor(canvas.height * scale);
      resizedContext.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
      return resizedCanvas;
    }
    
    return canvas;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('PDFファイルの処理に失敗しました。');
  }
};

// --- 画像前処理(簡易) ---
const preprocess = async (fileOrDataUrl: string | Blob | File): Promise<HTMLCanvasElement> => {
  // PDFファイルの場合は専用処理
  if (fileOrDataUrl instanceof File && fileOrDataUrl.type === 'application/pdf') {
    return await processPdf(fileOrDataUrl);
  }
  
  const img = new Image();
  const dataUrl = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : await blobToDataURL(fileOrDataUrl);
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = dataUrl; });

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const maxW = 1800; // 解像度を適度に制限
  const scale = img.width > maxW ? maxW / img.width : 1;
  c.width = Math.floor(img.width * scale);
  c.height = Math.floor(img.height * scale);
  ctx.drawImage(img, 0, 0, c.width, c.height);

  // グレースケール + 簡易二値化 + 収縮/膨張でノイズ抑制
  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    const v = g > 180 ? 255 : 0; // 簡易閾値（必要ならOtsuに差し替え）
    d[i] = d[i+1] = d[i+2] = v;
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
};

const blobToDataURL = (blob: Blob) => new Promise<string>((res) => {
  const r = new FileReader();
  r.onload = () => res(r.result as string);
  r.readAsDataURL(blob);
});

// --- OCRメイン ---
export type OcrResult = {
  rawText: string;
  date?: string;
  amount?: number;
  receiptNumber?: string;
};

export const recognizeReceipt = async (fileOrDataUrl: Blob | string | File): Promise<OcrResult> => {
  const worker = await getOcrWorker();
  const canvas = await preprocess(fileOrDataUrl);
  const { data } = await worker.recognize(canvas);
  const raw = data.text || '';

  // ルール抽出（例: 日付/金額/番号）
  const date = (raw.match(/20\d{2}[-/\.](0?[1-9]|1[0-2])[-/\.](0?[1-9]|[12]\d|3[01])/)?.[0] || '')
    .replace(/\./g,'-').replace(/\//g,'-');
  const amountStr = (raw.match(/(?:¥|\b)\s?([\d,]{1,12})(?:\.\d{1,2})?/i)?.[1] ||
                     raw.match(/\bTOTAL\s*[:：]?\s*([\d,]{1,12})/i)?.[1] || '')
    .replace(/[^\d]/g,'');
  const amount = amountStr ? Number(amountStr) : undefined;
  const receiptNumber = raw.match(/\bT\d{12,13}\b/)?.[0];

  return { rawText: raw, date, amount, receiptNumber };
};

// 既存の関数との互換性を保つ
export const processImageWithOCR = async (file: File): Promise<any> => {
  const result = await recognizeReceipt(file);
  return {
    text: result.rawText,
    date: result.date,
    totalAmount: result.amount,
    receiptNumber: result.receiptNumber,
    // その他のフィールドは空で返す
    category: '',
    description: '',
    taxRate: 10,
    isQualified: true,
    imageData: await blobToDataURL(file)
  };
}; 
