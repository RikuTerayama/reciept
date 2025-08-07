/**
 * レシート自動検出機能
 * 高度な画像前処理とレシート検出
 */

export interface ReceiptDetectionResult {
  success: boolean;
  croppedImage?: HTMLCanvasElement;
  originalImage?: HTMLCanvasElement;
  error?: string;
}

/**
 * レシート領域を検出して自動トリミング（簡易版）
 */
export async function detectAndCropReceipt(file: File): Promise<ReceiptDetectionResult> {
  try {
    // 画像を読み込み
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 画像サイズを制限（処理速度向上のため）
    const maxSize = 1200;
    let { width, height } = image;
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // 簡易的なレシート検出（エッジ検出ベース）
    const hasReceipt = await detectReceiptEdges(canvas);
    
    if (hasReceipt) {
      // レシートが検出された場合、自動トリミングを実行
      const croppedCanvas = await cropReceiptArea(canvas);
      
      return {
        success: true,
        croppedImage: croppedCanvas,
        originalImage: canvas
      };
    } else {
      // レシートが検出されない場合は元画像を返す
      return {
        success: false,
        originalImage: canvas,
        error: 'レシートの境界を検出できませんでした'
      };
    }

  } catch (error) {
    console.error('レシート検出エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'レシート検出に失敗しました'
    };
  }
}

/**
 * エッジ検出によるレシート検出
 */
async function detectReceiptEdges(canvas: HTMLCanvasElement): Promise<boolean> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  let edgeCount = 0;
  const threshold = 50;
  
  // 簡易的なエッジ検出（Sobelフィルタ）
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // グレースケール値
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      
      // 水平方向のエッジ
      const gx = 
        data[idx - 4] + 2 * data[idx] + data[idx + 4] -
        data[idx - 4 - width * 4] - 2 * data[idx - width * 4] - data[idx + 4 - width * 4];
      
      // 垂直方向のエッジ
      const gy = 
        data[idx - width * 4] + 2 * data[idx] + data[idx + width * 4] -
        data[idx - 4 - width * 4] - 2 * data[idx - 4] - data[idx - 4 + width * 4];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > threshold) {
        edgeCount++;
      }
    }
  }
  
  const edgeRatio = edgeCount / (width * height);
  return edgeRatio > 0.01; // エッジ密度が1%以上ならレシートと判定
}

/**
 * レシート領域の自動トリミング
 */
async function cropReceiptArea(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  
  // 簡易的なトリミング（画像の中央80%を切り出し）
  const marginX = Math.floor(width * 0.1);
  const marginY = Math.floor(height * 0.1);
  const cropWidth = width - marginX * 2;
  const cropHeight = height - marginY * 2;
  
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;
  
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  
  croppedCtx.drawImage(
    canvas,
    marginX, marginY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );
  
  return croppedCanvas;
}

/**
 * 画像ファイルをImageオブジェクトに読み込み
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 高度な画像前処理（OCR精度向上版）
 */
export async function preprocessImageForOCR(file: File): Promise<HTMLCanvasElement> {
  try {
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 画像サイズを最適化（OCR精度と処理速度のバランス）
    const maxSize = 1600;
    let { width, height } = image;
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // 1. ノイズ除去（ガウシアンフィルタ）
    const denoisedCanvas = await applyGaussianBlur(canvas, 0.5);
    
    // 2. グレースケール化（最適化版）
    const grayscaleCanvas = await convertToGrayscale(denoisedCanvas);
    
    // 3. コントラスト強化（適応的ヒストグラム平坦化）
    const contrastCanvas = await enhanceContrast(grayscaleCanvas);
    
    // 4. シャープニング（エッジ強調）
    const sharpenedCanvas = await applySharpening(contrastCanvas);
    
    // 5. 二値化（適応的閾値処理）
    const binarizedCanvas = await applyAdaptiveThreshold(sharpenedCanvas);
    
    // 6. モルフォロジー処理（ノイズ除去）
    const cleanedCanvas = await applyMorphology(binarizedCanvas);
    
    return cleanedCanvas;

  } catch (error) {
    console.error('画像前処理エラー:', error);
    // エラー時は基本的な前処理のみ実行
    return await basicPreprocessing(file);
  }
}

/**
 * ガウシアンフィルタによるノイズ除去
 */
async function applyGaussianBlur(canvas: HTMLCanvasElement, radius: number): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const kernel = generateGaussianKernel(radius);
  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);
  
  const result = new Uint8ClampedArray(data.length);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx - halfKernel));
          const py = Math.max(0, Math.min(height - 1, y + ky - halfKernel));
          const pidx = (py * width + px) * 4;
          const weight = kernel[ky][kx];
          
          r += data[pidx] * weight;
          g += data[pidx + 1] * weight;
          b += data[pidx + 2] * weight;
          a += data[pidx + 3] * weight;
          weightSum += weight;
        }
      }
      
      result[idx] = r / weightSum;
      result[idx + 1] = g / weightSum;
      result[idx + 2] = b / weightSum;
      result[idx + 3] = a / weightSum;
    }
  }
  
  const resultCanvas = document.createElement('canvas');
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCanvas.width = width;
  resultCanvas.height = height;
  resultCtx.putImageData(new ImageData(result, width, height), 0, 0);
  
  return resultCanvas;
}

/**
 * ガウシアンカーネル生成
 */
function generateGaussianKernel(radius: number): number[][] {
  const size = Math.ceil(radius * 6);
  const kernel: number[][] = [];
  const sigma = radius;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[y][x] = value;
    }
  }
  
  // 正規化
  let sum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      sum += kernel[y][x];
    }
  }
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }
  
  return kernel;
}

/**
 * グレースケール変換（最適化版）
 */
async function convertToGrayscale(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // 人間の視覚特性に基づく重み付け
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * 適応的ヒストグラム平坦化によるコントラスト強化
 */
async function enhanceContrast(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // ヒストグラム計算
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }
  
  // 累積分布関数計算
  const cdf = new Array(256);
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    cdf[i] = sum;
  }
  
  // 正規化
  const minCdf = cdf.find(val => val > 0) || 0;
  const maxCdf = cdf[255];
  
  // コントラスト強化
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i];
    const normalized = ((cdf[gray] - minCdf) / (maxCdf - minCdf)) * 255;
    data[i] = Math.round(normalized);
    data[i + 1] = Math.round(normalized);
    data[i + 2] = Math.round(normalized);
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * アンシャープマスクによるシャープニング
 */
async function applySharpening(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const result = new Uint8ClampedArray(data.length);
  
  // アンシャープマスクカーネル
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      let sum = 0;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = x + kx - 1;
          const py = y + ky - 1;
          const pidx = (py * width + px) * 4;
          sum += data[pidx] * kernel[ky][kx];
        }
      }
      
      const sharpened = Math.max(0, Math.min(255, sum));
      result[idx] = sharpened;
      result[idx + 1] = sharpened;
      result[idx + 2] = sharpened;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  // 境界部分は元の値を保持
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        const idx = (y * width + x) * 4;
        result[idx] = data[idx];
        result[idx + 1] = data[idx + 1];
        result[idx + 2] = data[idx + 2];
        result[idx + 3] = data[idx + 3];
      }
    }
  }
  
  const resultCanvas = document.createElement('canvas');
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCanvas.width = width;
  resultCanvas.height = height;
  resultCtx.putImageData(new ImageData(result, width, height), 0, 0);
  
  return resultCanvas;
}

/**
 * 適応的閾値処理による二値化
 */
async function applyAdaptiveThreshold(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const result = new Uint8ClampedArray(data.length);
  const windowSize = 15;
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // 局所平均計算
      let sum = 0;
      let count = 0;
      
      for (let wy = Math.max(0, y - halfWindow); wy <= Math.min(height - 1, y + halfWindow); wy++) {
        for (let wx = Math.max(0, x - halfWindow); wx <= Math.min(width - 1, x + halfWindow); wx++) {
          const widx = (wy * width + wx) * 4;
          sum += data[widx];
          count++;
        }
      }
      
      const localMean = sum / count;
      const threshold = localMean * 0.9; // 適応的閾値
      
      const pixel = data[idx];
      const binary = pixel > threshold ? 255 : 0;
      
      result[idx] = binary;
      result[idx + 1] = binary;
      result[idx + 2] = binary;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  const resultCanvas = document.createElement('canvas');
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCanvas.width = width;
  resultCanvas.height = height;
  resultCtx.putImageData(new ImageData(result, width, height), 0, 0);
  
  return resultCanvas;
}

/**
 * モルフォロジー処理によるノイズ除去
 */
async function applyMorphology(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // オープニング（エロージョン + ディレーション）
  const opened = await applyErosion(canvas);
  const result = await applyDilation(opened);
  
  return result;
}

/**
 * エロージョン処理
 */
async function applyErosion(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const result = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      let min = 255;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = x + dx;
          const py = y + dy;
          const pidx = (py * width + px) * 4;
          min = Math.min(min, data[pidx]);
        }
      }
      
      result[idx] = min;
      result[idx + 1] = min;
      result[idx + 2] = min;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  const resultCanvas = document.createElement('canvas');
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCanvas.width = width;
  resultCanvas.height = height;
  resultCtx.putImageData(new ImageData(result, width, height), 0, 0);
  
  return resultCanvas;
}

/**
 * ディレーション処理
 */
async function applyDilation(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const result = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      let max = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = x + dx;
          const py = y + dy;
          const pidx = (py * width + px) * 4;
          max = Math.max(max, data[pidx]);
        }
      }
      
      result[idx] = max;
      result[idx + 1] = max;
      result[idx + 2] = max;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  const resultCanvas = document.createElement('canvas');
  const resultCtx = resultCanvas.getContext('2d')!;
  resultCanvas.width = width;
  resultCanvas.height = height;
  resultCtx.putImageData(new ImageData(result, width, height), 0, 0);
  
  return resultCanvas;
}

/**
 * 基本的な前処理（フォールバック用）
 */
async function basicPreprocessing(file: File): Promise<HTMLCanvasElement> {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const maxSize = 1200;
  let { width, height } = image;
  
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  // 基本的なグレースケール化
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // 基本的なコントラスト強化
  ctx.filter = 'contrast(1.2) brightness(1.02)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  
  return canvas;
} 
