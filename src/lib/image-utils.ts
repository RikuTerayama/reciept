/**
 * 画像ユーティリティ関数
 */

// Base64画像データをBlobに変換
export const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// BlobをBase64に変換
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 画像ファイルをBase64に変換
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// レシート番号を生成
export const generateReceiptNumber = (date: string, amount: number): string => {
  const dateStr = date.replace(/-/g, '');
  const amountStr = amount.toString();
  const paddedAmount = amountStr.length < 8 ? '0'.repeat(8 - amountStr.length) + amountStr : amountStr;
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `R${dateStr}${paddedAmount}${randomStr}`;
};

// 画像圧縮・最適化機能

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// デフォルト圧縮オプション
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'jpeg'
};

// 画像圧縮（効率化版）
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      try {
        // アスペクト比を保持しながらリサイズ
        const { width, height } = calculateDimensions(img.width, img.height, opts.maxWidth!, opts.maxHeight!);
        
        canvas.width = width;
        canvas.height = height;
        
        // 高品質なリサイズ（Lanczosフィルタ）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // 圧縮された画像をBase64で返す
        const mimeType = `image/${opts.format}`;
        const compressedDataUrl = canvas.toDataURL(mimeType, opts.quality);
        
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

// 画像サイズ計算（アスペクト比保持）
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // 最大サイズを超える場合のみリサイズ
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  return { width, height };
}

// バッチ画像圧縮（並列処理）
export async function compressImages(
  files: File[], 
  options: CompressionOptions = {}
): Promise<string[]> {
  const compressionPromises = files.map(file => compressImage(file, options));
  
  try {
    const results = await Promise.all(compressionPromises);
    return results;
  } catch (error) {
    console.error('バッチ画像圧縮エラー:', error);
    throw error;
  }
}

// 画像前処理（OCR最適化）
export async function preprocessImageForOCR(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      try {
        // OCR用の最適サイズ（1200px以下）
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
        
        // グレースケール化（OCR精度向上）
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

// 画像形式判定
export function getImageFormat(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;
  
  if (mimeType.includes('jpeg') || mimeType.includes('jpg') || extension === 'jpg' || extension === 'jpeg') {
    return 'jpeg';
  } else if (mimeType.includes('png') || extension === 'png') {
    return 'png';
  } else if (mimeType.includes('webp') || extension === 'webp') {
    return 'webp';
  } else {
    return 'jpeg'; // デフォルト
  }
}

// 画像サイズ取得
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('画像サイズの取得に失敗しました'));
    img.src = URL.createObjectURL(file);
  });
}

// 画像のダウンロード
export const downloadImage = (base64: string, filename: string) => {
  const link = document.createElement('a');
  link.href = base64;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 複数画像の一括ダウンロード
export const downloadMultipleImages = async (images: Array<{ base64: string; filename: string }>) => {
  // 各画像を個別にダウンロード
  for (const image of images) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 少し遅延を入れる
    downloadImage(image.base64, image.filename);
  }
};

// ZIPファイルでの一括ダウンロード（フォールバック: 個別ダウンロード）
export const downloadImagesAsZip = async (images: Array<{ base64: string; filename: string }>) => {
  try {
    // JSZipが利用可能な場合のみZIPダウンロードを試行
    if (typeof window !== 'undefined' && 'JSZip' in window) {
      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      
      // 各画像をZIPに追加
      images.forEach(({ base64, filename }) => {
        const blob = base64ToBlob(base64);
        zip.file(filename, blob);
      });
      
      // ZIPファイルを生成
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // ダウンロード
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `receipts_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
      // JSZipが利用できない場合は個別ダウンロード
      await downloadMultipleImages(images);
    }
  } catch (error) {
    console.error('ZIPダウンロードエラー:', error);
    // フォールバック: 個別ダウンロード
    await downloadMultipleImages(images);
  }
}; 
