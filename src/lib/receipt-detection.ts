export interface ReceiptBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReceiptDetectionResult {
  success: boolean;
  bounds?: ReceiptBounds;
  croppedImage?: string;
  error?: string;
}

// レシート検出のための設定
const DETECTION_CONFIG = {
  minAspectRatio: 0.5, // 最小縦横比
  maxAspectRatio: 3.0, // 最大縦横比
  minArea: 0.1, // 最小面積（画像全体に対する割合）
  maxArea: 0.9, // 最大面積（画像全体に対する割合）
  edgeThreshold: 50, // エッジ検出の閾値
  contourApproximation: 0.02, // 輪郭近似の精度
};

export async function detectReceiptInImage(imageFile: File): Promise<ReceiptDetectionResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // キャンバスサイズを設定
        canvas.width = img.width;
        canvas.height = img.height;

        // 画像をキャンバスに描画
        ctx?.drawImage(img, 0, 0);

        // レシート領域を検出
        const bounds = detectReceiptBounds(canvas, ctx!);
        
        if (bounds) {
          // レシート領域を切り抜き
          const croppedCanvas = cropReceipt(canvas, bounds);
          const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
          
          resolve({
            success: true,
            bounds,
            croppedImage
          });
        } else {
          resolve({
            success: false,
            error: 'レシート領域を検出できませんでした。手動で撮影してください。'
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: '画像処理中にエラーが発生しました。'
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: '画像の読み込みに失敗しました。'
      });
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

function detectReceiptBounds(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): ReceiptBounds | null {
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // グレースケール変換とエッジ検出
  const edges = detectEdges(data, width, height);
  
  // 輪郭検出
  const contours = findContours(edges, width, height);
  
  // レシートらしい輪郭を選択
  const receiptContour = selectReceiptContour(contours, width, height);
  
  if (receiptContour) {
    return calculateBounds(receiptContour);
  }
  
  return null;
}

function detectEdges(imageData: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);
  const threshold = DETECTION_CONFIG.edgeThreshold;

  // Sobelフィルタによるエッジ検出
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // グレースケール値の計算
      const gray = (imageData[idx * 4] + imageData[idx * 4 + 1] + imageData[idx * 4 + 2]) / 3;
      
      // Sobelフィルタ
      const gx = 
        -imageData[(y - 1) * width * 4 + (x - 1) * 4] +
        imageData[(y - 1) * width * 4 + (x + 1) * 4] +
        -2 * imageData[y * width * 4 + (x - 1) * 4] +
        2 * imageData[y * width * 4 + (x + 1) * 4] +
        -imageData[(y + 1) * width * 4 + (x - 1) * 4] +
        imageData[(y + 1) * width * 4 + (x + 1) * 4];
      
      const gy = 
        -imageData[(y - 1) * width * 4 + (x - 1) * 4] +
        -2 * imageData[(y - 1) * width * 4 + x * 4] +
        -imageData[(y - 1) * width * 4 + (x + 1) * 4] +
        imageData[(y + 1) * width * 4 + (x - 1) * 4] +
        2 * imageData[(y + 1) * width * 4 + x * 4] +
        imageData[(y + 1) * width * 4 + (x + 1) * 4];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[idx] = magnitude > threshold ? 255 : 0;
    }
  }
  
  return edges;
}

function findContours(edges: Uint8Array, width: number, height: number): number[][] {
  const contours: number[][] = [];
  const visited = new Set<number>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (edges[idx] === 255 && !visited.has(idx)) {
        const contour = traceContour(edges, width, height, x, y, visited);
        if (contour.length > 10) { // 最小輪郭サイズ
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

function traceContour(edges: Uint8Array, width: number, height: number, startX: number, startY: number, visited: Set<number>): number[] {
  const contour: number[] = [];
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
  
  let x = startX;
  let y = startY;
  let direction = 0;
  
  do {
    const idx = y * width + x;
    contour.push(idx);
    visited.add(idx);
    
    // 次のエッジピクセルを探す
    let found = false;
    for (let i = 0; i < 8; i++) {
      const newDirection = (direction + i) % 8;
      const [dx, dy] = directions[newDirection];
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const newIdx = newY * width + newX;
        if (edges[newIdx] === 255 && !visited.has(newIdx)) {
          x = newX;
          y = newY;
          direction = newDirection;
          found = true;
          break;
        }
      }
    }
    
    if (!found) break;
  } while (x !== startX || y !== startY);
  
  return contour;
}

function selectReceiptContour(contours: number[][], width: number, height: number): number[] | null {
  let bestContour: number[] | null = null;
  let bestScore = 0;
  
  for (const contour of contours) {
    const bounds = calculateBoundsFromContour(contour, width);
    const score = calculateReceiptScore(bounds, width, height);
    
    if (score > bestScore) {
      bestScore = score;
      bestContour = contour;
    }
  }
  
  return bestContour;
}

function calculateBoundsFromContour(contour: number[], width: number): ReceiptBounds {
  let minX = width, minY = Infinity, maxX = 0, maxY = 0;
  
  for (const idx of contour) {
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function calculateReceiptScore(bounds: ReceiptBounds, imageWidth: number, imageHeight: number): number {
  const aspectRatio = bounds.width / bounds.height;
  const area = (bounds.width * bounds.height) / (imageWidth * imageHeight);
  
  // アスペクト比のスコア
  const aspectScore = aspectRatio >= DETECTION_CONFIG.minAspectRatio && 
                     aspectRatio <= DETECTION_CONFIG.maxAspectRatio ? 1 : 0;
  
  // 面積のスコア
  const areaScore = area >= DETECTION_CONFIG.minArea && 
                   area <= DETECTION_CONFIG.maxArea ? 1 : 0;
  
  // 位置のスコア（中央に近いほど高スコア）
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const distanceFromCenter = Math.sqrt(
    Math.pow(centerX - imageWidth / 2, 2) + 
    Math.pow(centerY - imageHeight / 2, 2)
  );
  const maxDistance = Math.sqrt(Math.pow(imageWidth / 2, 2) + Math.pow(imageHeight / 2, 2));
  const positionScore = 1 - (distanceFromCenter / maxDistance);
  
  return aspectScore * 0.4 + areaScore * 0.4 + positionScore * 0.2;
}

function calculateBounds(contour: number[]): ReceiptBounds {
  // 輪郭から境界を計算
  const points = contour.map(idx => ({
    x: idx % 1000, // 仮の幅
    y: Math.floor(idx / 1000)
  }));
  
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function cropReceipt(canvas: HTMLCanvasElement, bounds: ReceiptBounds): HTMLCanvasElement {
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;
  
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;
  
  croppedCtx.drawImage(
    canvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );
  
  return croppedCanvas;
}

// 簡易版レシート検出（フォールバック）
export async function simpleReceiptDetection(imageFile: File): Promise<ReceiptDetectionResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // 簡易的な検出：画像の中央80%をレシートとして扱う
        const margin = 0.1; // 10%のマージン
        const bounds: ReceiptBounds = {
          x: img.width * margin,
          y: img.height * margin,
          width: img.width * (1 - 2 * margin),
          height: img.height * (1 - 2 * margin)
        };

        const croppedCanvas = cropReceipt(canvas, bounds);
        const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);

        resolve({
          success: true,
          bounds,
          croppedImage
        });
      } catch (error) {
        resolve({
          success: false,
          error: '画像処理中にエラーが発生しました。'
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: '画像の読み込みに失敗しました。'
      });
    };

    img.src = URL.createObjectURL(imageFile);
  });
} 
