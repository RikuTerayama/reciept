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

// 画像の圧縮（最適化版）
export const compressImage = (file: File | string, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 最大サイズを設定（1200x800に縮小して処理速度向上）
      const maxWidth = 1200;
      const maxHeight = 800;
      
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    // File または string に対応
    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
};

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
