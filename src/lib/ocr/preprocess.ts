import { processPdf } from './pdf';

// 画像前処理の設定
const MAX_DIMENSION = 1800;
const BINARY_THRESHOLD = 180;
const TILT_RANGE = 5; // -5°〜+5°の範囲で傾き補正

export interface PreprocessOptions {
  enableTiltCorrection?: boolean;
  enableNoiseReduction?: boolean;
  maxDimension?: number;
}

/**
 * 画像の前処理を実行
 * - EXIF回転補正
 * - グレースケール変換
 * - 自動二値化
 * - ノイズ除去
 * - リサイズ
 * - 傾き補正（オプション）
 */
export const preprocessImage = async (
  input: File | Blob | string,
  options: PreprocessOptions = {}
): Promise<HTMLCanvasElement> => {
  const {
    enableTiltCorrection = true,
    enableNoiseReduction = true,
    maxDimension = MAX_DIMENSION
  } = options;

  // PDFファイルの場合は専用処理
  if (input instanceof File && input.type === 'application/pdf') {
    return await processPdf(input);
  }

  // 画像をCanvasに変換
  const canvas = await createCanvasFromInput(input);
  
  // リサイズ（長辺をmaxDimensionに制限）
  const resizedCanvas = resizeCanvas(canvas, maxDimension);
  
  // グレースケール変換
  const grayscaleCanvas = convertToGrayscale(resizedCanvas);
  
  // 自動二値化
  const binaryCanvas = applyBinaryThreshold(grayscaleCanvas);
  
  // ノイズ除去
  const denoisedCanvas = enableNoiseReduction 
    ? removeNoise(binaryCanvas) 
    : binaryCanvas;
  
  // 傾き補正
  const finalCanvas = enableTiltCorrection 
    ? correctTilt(denoisedCanvas) 
    : denoisedCanvas;

  return finalCanvas;
};

/**
 * 入力からCanvasを作成
 */
const createCanvasFromInput = async (input: File | Blob | string): Promise<HTMLCanvasElement> => {
  const img = new Image();
  
  let dataUrl: string;
  if (typeof input === 'string') {
    dataUrl = input;
  } else {
    dataUrl = await blobToDataURL(input);
  }
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  return canvas;
};

/**
 * Canvasのリサイズ
 */
const resizeCanvas = (canvas: HTMLCanvasElement, maxDimension: number): HTMLCanvasElement => {
  const { width, height } = canvas;
  const maxSide = Math.max(width, height);
  
  if (maxSide <= maxDimension) {
    return canvas;
  }
  
  const scale = maxDimension / maxSide;
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);
  
  const resizedCanvas = document.createElement('canvas');
  const ctx = resizedCanvas.getContext('2d')!;
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  
  // 高品質なリサイズ
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  return resizedCanvas;
};

/**
 * グレースケール変換
 */
const convertToGrayscale = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // 人間の目の感度に基づく重み付け
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = Math.round(gray);
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * 自動二値化（Otsu法の簡易実装）
 */
const applyBinaryThreshold = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // ヒストグラム作成
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }
  
  // 最適な閾値を計算（簡易版）
  let totalPixels = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  let sumB = 0;
  let weightB = 0;
  let weightF = 0;
  let maxVariance = 0;
  let threshold = BINARY_THRESHOLD;
  
  for (let t = 0; t < 256; t++) {
    weightB += histogram[t];
    if (weightB === 0) continue;
    
    weightF = totalPixels - weightB;
    if (weightF === 0) break;
    
    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    
    const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  
  // 二値化適用
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * ノイズ除去（モルフォロジー演算の簡易実装）
 */
const removeNoise = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // 3x3のカーネルでノイズ除去
  const kernel = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];
  
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let sum = 0;
      let count = 0;
      
      // 3x3の近傍をチェック
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kIdx = ((y + ky) * width + (x + kx)) * 4;
          if (data[kIdx] === 255) {
            sum += 255;
            count++;
          }
        }
      }
      
      // 過半数が白なら白、そうでなければ黒
      const newValue = count > 4 ? 255 : 0;
      newData[idx] = newData[idx + 1] = newData[idx + 2] = newValue;
    }
  }
  
  const newImageData = new ImageData(newData, width, height);
  ctx.putImageData(newImageData, 0, 0);
  
  return canvas;
};

/**
 * 傾き補正（投影プロファイル法の簡易実装）
 */
const correctTilt = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  
  let bestAngle = 0;
  let maxVariance = 0;
  
  // -5°〜+5°の範囲で最適な角度を探索
  for (let angle = -TILT_RANGE; angle <= TILT_RANGE; angle += 0.5) {
    const variance = calculateProjectionVariance(canvas, angle);
    if (variance > maxVariance) {
      maxVariance = variance;
      bestAngle = angle;
    }
  }
  
  // 傾きが小さい場合は補正しない
  if (Math.abs(bestAngle) < 0.5) {
    return canvas;
  }
  
  // 回転補正
  return rotateCanvas(canvas, bestAngle);
};

/**
 * 投影プロファイルの分散を計算
 */
const calculateProjectionVariance = (canvas: HTMLCanvasElement, angle: number): number => {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 水平投影プロファイル
  const projection = new Array(height).fill(0);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] === 0) { // 黒ピクセル
        projection[y]++;
      }
    }
  }
  
  // 分散を計算
  const mean = projection.reduce((a, b) => a + b, 0) / height;
  const variance = projection.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / height;
  
  return variance;
};

/**
 * Canvasを回転
 */
const rotateCanvas = (canvas: HTMLCanvasElement, angle: number): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  
  // 回転後のサイズを計算
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const newWidth = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin));
  const newHeight = Math.ceil(Math.abs(width * sin) + Math.abs(height * cos));
  
  const rotatedCanvas = document.createElement('canvas');
  const rotatedCtx = rotatedCanvas.getContext('2d')!;
  rotatedCanvas.width = newWidth;
  rotatedCanvas.height = newHeight;
  
  // 回転中心を中央に設定
  rotatedCtx.translate(newWidth / 2, newHeight / 2);
  rotatedCtx.rotate(rad);
  rotatedCtx.drawImage(canvas, -width / 2, -height / 2);
  
  return rotatedCanvas;
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
