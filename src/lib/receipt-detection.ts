/**
 * レシート自動検出機能
 * OpenCV.jsを使用してレシート領域を検出し、自動トリミングを行う
 */

export interface ReceiptDetectionResult {
  success: boolean;
  croppedImage?: HTMLCanvasElement;
  originalImage?: HTMLCanvasElement;
  error?: string;
}

// OpenCV.jsの読み込み
let opencvLoaded = false;
let opencvPromise: Promise<void> | null = null;

function loadOpenCV(): Promise<void> {
  if (opencvLoaded) {
    return Promise.resolve();
  }
  
  if (opencvPromise) {
    return opencvPromise;
  }

  opencvPromise = new Promise((resolve, reject) => {
    // OpenCV.jsの動的読み込み
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      // OpenCVが読み込まれるまで待機
      const checkOpenCV = () => {
        if (typeof (window as any).cv !== 'undefined') {
          opencvLoaded = true;
          resolve();
        } else {
          setTimeout(checkOpenCV, 100);
        }
      };
      checkOpenCV();
    };
    script.onerror = () => {
      reject(new Error('OpenCV.jsの読み込みに失敗しました'));
    };
    document.head.appendChild(script);
  });

  return opencvPromise;
}

/**
 * レシート領域を検出して自動トリミング
 */
export async function detectAndCropReceipt(file: File): Promise<ReceiptDetectionResult> {
  try {
    await loadOpenCV();
    const cv = (window as any).cv;

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

    // OpenCV用のMatを作成
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // ノイズ除去
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // エッジ検出
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    // 輪郭検出
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // 最大の輪郭を探す（レシートの境界と仮定）
    let maxArea = 0;
    let bestContour = null;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      if (area > maxArea && area > width * height * 0.1) { // 最小面積の閾値
        maxArea = area;
        bestContour = contour;
      }
    }

    if (!bestContour) {
      // 輪郭が見つからない場合は元画像を返す
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      
      return {
        success: false,
        originalImage: canvas,
        error: 'レシートの境界を検出できませんでした'
      };
    }

    // 輪郭を近似して四角形を取得
    const epsilon = 0.02 * cv.arcLength(bestContour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(bestContour, approx, epsilon, true);

    // 4つの頂点を持つ四角形かチェック
    if (approx.rows !== 4) {
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      approx.delete();
      
      return {
        success: false,
        originalImage: canvas,
        error: 'レシートの形状を検出できませんでした'
      };
    }

    // 頂点を時計回りにソート
    const points = [];
    for (let i = 0; i < 4; i++) {
      points.push({
        x: approx.data32S[i * 2],
        y: approx.data32S[i * 2 + 1]
      });
    }

    // 左上、右上、右下、左下の順にソート
    points.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    // 左上と右上を比較して、より左側を左上に
    if (points[0].x > points[1].x) {
      [points[0], points[1]] = [points[1], points[0]];
    }

    // 左下と右下を比較して、より左側を左下に
    if (points[2].x > points[3].x) {
      [points[2], points[3]] = [points[3], points[2]];
    }

    // 透視変換のための変換行列を計算
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x, points[0].y,
      points[1].x, points[1].y,
      points[2].x, points[2].y,
      points[3].x, points[3].y
    ]);

    // 出力サイズを計算
    const width1 = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
    const width2 = Math.sqrt(Math.pow(points[3].x - points[2].x, 2) + Math.pow(points[3].y - points[2].y, 2));
    const height1 = Math.sqrt(Math.pow(points[2].x - points[0].x, 2) + Math.pow(points[2].y - points[0].y, 2));
    const height2 = Math.sqrt(Math.pow(points[3].x - points[1].x, 2) + Math.pow(points[3].y - points[1].y, 2));

    const maxWidth = Math.max(width1, width2);
    const maxHeight = Math.max(height1, height2);

    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      maxWidth, 0,
      0, maxHeight,
      maxWidth, maxHeight
    ]);

    // 透視変換行列を計算
    const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // 透視変換を実行
    const warped = new cv.Mat();
    cv.warpPerspective(src, warped, transformMatrix, new cv.Size(maxWidth, maxHeight));

    // 結果をキャンバスに描画
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = maxWidth;
    resultCanvas.height = maxHeight;
    cv.imshow(resultCanvas, warped);

    // メモリ解放
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    approx.delete();
    srcPoints.delete();
    dstPoints.delete();
    transformMatrix.delete();
    warped.delete();

    return {
      success: true,
      croppedImage: resultCanvas,
      originalImage: canvas
    };

  } catch (error) {
    console.error('レシート検出エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'レシート検出に失敗しました'
    };
  }
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
    await loadOpenCV();
    const cv = (window as any).cv;

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

    // OpenCV用のMatを作成
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // ノイズ除去
    const denoised = new cv.Mat();
    cv.medianBlur(gray, denoised, 3);

    // コントラスト強化
    const enhanced = new cv.Mat();
    cv.convertScaleAbs(denoised, enhanced, 1.2, 10);

    // 二値化
    const binary = new cv.Mat();
    cv.adaptiveThreshold(enhanced, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    // 結果をキャンバスに描画
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    cv.imshow(resultCanvas, binary);

    // メモリ解放
    src.delete();
    gray.delete();
    denoised.delete();
    enhanced.delete();
    binary.delete();

    return resultCanvas;

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
