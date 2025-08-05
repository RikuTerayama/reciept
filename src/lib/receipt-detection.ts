/**
 * レシート自動検出機能
 * 簡易版のレシート検出と画像前処理
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
 * 画像の前処理（グレースケール化・コントラスト調整）
 */
export async function preprocessImageForOCR(file: File): Promise<HTMLCanvasElement> {
  try {
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 画像サイズを制限
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

    // グレースケール化
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // コントラスト強化
    ctx.filter = 'contrast(1.2) brightness(1.02)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    
    return canvas;

  } catch (error) {
    console.error('画像前処理エラー:', error);
    // エラー時は元画像を返す
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    return canvas;
  }
} 
