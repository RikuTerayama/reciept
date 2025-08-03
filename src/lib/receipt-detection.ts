// レシート検出と画像処理機能

interface ReceiptBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

// レシート検出（簡易版）
export async function detectReceipt(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // 簡易的なレシート検出（エッジ検出ベース）
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const edges = detectEdges(imageData);
      const hasReceipt = analyzeEdges(edges, canvas.width, canvas.height);
      
      resolve(hasReceipt);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// エッジ検出
function detectEdges(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const edges = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Sobelフィルタ
      const gx = 
        data[idx - 4 - width * 4] + 2 * data[idx - width * 4] + data[idx + 4 - width * 4] -
        data[idx - 4 + width * 4] - 2 * data[idx + width * 4] - data[idx + 4 + width * 4];
      
      const gy = 
        data[idx - 4 - width * 4] + 2 * data[idx - 4] + data[idx - 4 + width * 4] -
        data[idx + 4 - width * 4] - 2 * data[idx + 4] - data[idx + 4 + width * 4];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edgeValue = Math.min(255, magnitude);
      
      edges[idx] = edgeValue;
      edges[idx + 1] = edgeValue;
      edges[idx + 2] = edgeValue;
      edges[idx + 3] = 255;
    }
  }
  
  return edges;
}

// エッジ解析によるレシート検出
function analyzeEdges(edges: Uint8ClampedArray, width: number, height: number): boolean {
  let edgeCount = 0;
  const threshold = 50;
  
  for (let i = 0; i < edges.length; i += 4) {
    if (edges[i] > threshold) {
      edgeCount++;
    }
  }
  
  const edgeRatio = edgeCount / (edges.length / 4);
  return edgeRatio > 0.01; // エッジ密度が1%以上ならレシートと判定
}

// レシートの輪郭検出と切り出し
export async function detectAndCropReceipt(file: File): Promise<{ croppedImage: string; bounds: ReceiptBounds }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      try {
        // キャンバスサイズを設定
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // レシートの境界を検出
        const bounds = detectReceiptBounds(canvas);
        
        // レシート部分を切り出し
        const croppedCanvas = cropReceipt(canvas, bounds);
        
        // 傾き補正
        const correctedCanvas = correctPerspective(croppedCanvas);
        
        // Base64に変換
        const croppedImage = correctedCanvas.toDataURL('image/jpeg', 0.9);
        
        resolve({
          croppedImage,
          bounds
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

// レシートの境界検出
function detectReceiptBounds(canvas: HTMLCanvasElement): ReceiptBounds {
  const { width, height } = canvas;
  
  // 簡易的な境界検出（実際の実装ではより高度なアルゴリズムを使用）
  const margin = Math.min(width, height) * 0.1;
  
  return {
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    angle: 0
  };
}

// レシート部分の切り出し
function cropReceipt(canvas: HTMLCanvasElement, bounds: ReceiptBounds): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas');
  const ctx = croppedCanvas.getContext('2d')!;
  
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;
  
  ctx.drawImage(
    canvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );
  
  return croppedCanvas;
}

// 透視変換による傾き補正
function correctPerspective(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const correctedCanvas = document.createElement('canvas');
  const ctx = correctedCanvas.getContext('2d')!;
  
  const { width, height } = canvas;
  correctedCanvas.width = width;
  correctedCanvas.height = height;
  
  // 簡易的な補正（実際の実装ではより高度なアルゴリズムを使用）
  ctx.drawImage(canvas, 0, 0);
  
  return correctedCanvas;
}

// 画像の前処理（OCR最適化）
export async function preprocessImageForOCR(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      try {
        // キャンバスサイズを設定（最大1200pxに制限）
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
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
        
        // Base64に変換
        const processedImage = canvas.toDataURL('image/jpeg', 0.9);
        resolve(processedImage);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

// レシート認識のプレビュー生成
export async function generateReceiptPreview(file: File): Promise<string> {
  try {
    const { croppedImage } = await detectAndCropReceipt(file);
    return croppedImage;
  } catch (error) {
    console.error('レシートプレビュー生成エラー:', error);
    // エラー時は元画像を返す
    return URL.createObjectURL(file);
  }
} 
