/**
 * 画像ストレージ管理ユーティリティ
 */

export interface StoredImage {
  id: string;
  originalName: string;
  dataUrl: string;
  timestamp: number;
  expenseId?: string; // 関連する経費ID
  ocrResult?: any; // OCR結果
}

export interface BudgetOptimizationImage {
  id: string;
  originalName: string;
  budgetNumber: number; // 予算最適化で振り分けられた番号
  expenseId?: string;
  dataUrl: string;
}

/**
 * 画像をローカルストレージに保存
 */
export function saveImageToStorage(
  imageFile: File | string, // File または dataURL
  originalName: string,
  expenseId?: string,
  ocrResult?: any
): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    try {
      const id = generateImageId();
      const timestamp = Date.now();
      
      let dataUrl: string;
      
      if (typeof imageFile === 'string') {
        // 既にdataURLの場合
        dataUrl = imageFile;
      } else {
        // Fileの場合、dataURLに変換
        const reader = new FileReader();
        reader.onload = () => {
          dataUrl = reader.result as string;
          const storedImage: StoredImage = {
            id,
            originalName,
            dataUrl,
            timestamp,
            expenseId,
            ocrResult
          };
          
          saveToLocalStorage(storedImage);
          resolve(storedImage);
        };
        reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        reader.readAsDataURL(imageFile);
        return;
      }
      
      const storedImage: StoredImage = {
        id,
        originalName,
        dataUrl,
        timestamp,
        expenseId,
        ocrResult
      };
      
      saveToLocalStorage(storedImage);
      resolve(storedImage);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 画像をローカルストレージから取得
 */
export function getImageFromStorage(imageId: string): StoredImage | null {
  try {
    const images = getAllStoredImages();
    return images.find(img => img.id === imageId) || null;
  } catch (error) {
    console.error('画像の取得に失敗しました:', error);
    return null;
  }
}

/**
 * 経費IDに関連する画像を取得
 */
export function getImagesByExpenseId(expenseId: string): StoredImage[] {
  try {
    const images = getAllStoredImages();
    return images.filter(img => img.expenseId === expenseId);
  } catch (error) {
    console.error('経費IDによる画像取得に失敗しました:', error);
    return [];
  }
}

/**
 * すべての保存された画像を取得
 */
export function getAllStoredImages(): StoredImage[] {
  try {
    const stored = localStorage.getItem('storedImages');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('保存された画像の取得に失敗しました:', error);
    return [];
  }
}

/**
 * 画像を削除
 */
export function deleteImageFromStorage(imageId: string): boolean {
  try {
    const images = getAllStoredImages();
    const filteredImages = images.filter(img => img.id !== imageId);
    localStorage.setItem('storedImages', JSON.stringify(filteredImages));
    return true;
  } catch (error) {
    console.error('画像の削除に失敗しました:', error);
    return false;
  }
}

/**
 * 経費IDに関連する画像を削除
 */
export function deleteImagesByExpenseId(expenseId: string): boolean {
  try {
    const images = getAllStoredImages();
    const filteredImages = images.filter(img => img.expenseId !== expenseId);
    localStorage.setItem('storedImages', JSON.stringify(filteredImages));
    return true;
  } catch (error) {
    console.error('経費IDによる画像削除に失敗しました:', error);
    return false;
  }
}

/**
 * 画像の名前を変更
 */
export function renameImage(imageId: string, newName: string): boolean {
  try {
    const images = getAllStoredImages();
    const imageIndex = images.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) return false;
    
    images[imageIndex].originalName = newName;
    localStorage.setItem('storedImages', JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('画像の名前変更に失敗しました:', error);
    return false;
  }
}

/**
 * 予算最適化用の画像リストを生成
 */
export function generateBudgetOptimizationImages(
  expenseIds: string[],
  budgetNumbers: number[]
): BudgetOptimizationImage[] {
  try {
    const images = getAllStoredImages();
    const optimizationImages: BudgetOptimizationImage[] = [];
    
    expenseIds.forEach((expenseId, index) => {
      const expenseImages = images.filter(img => img.expenseId === expenseId);
      expenseImages.forEach(img => {
        optimizationImages.push({
          id: img.id,
          originalName: img.originalName,
          budgetNumber: budgetNumbers[index] || 0,
          expenseId: img.expenseId,
          dataUrl: img.dataUrl
        });
      });
    });
    
    return optimizationImages;
  } catch (error) {
    console.error('予算最適化画像リストの生成に失敗しました:', error);
    return [];
  }
}

/**
 * 予算最適化番号で画像を取得
 */
export function getImageByBudgetNumber(budgetNumber: number): BudgetOptimizationImage[] {
  try {
    const stored = localStorage.getItem('budgetOptimizationImages');
    if (!stored) return [];
    
    const optimizationImages: BudgetOptimizationImage[] = JSON.parse(stored);
    return optimizationImages.filter(img => img.budgetNumber === budgetNumber);
  } catch (error) {
    console.error('予算最適化番号による画像取得に失敗しました:', error);
    return [];
  }
}

/**
 * 予算最適化画像リストを保存
 */
export function saveBudgetOptimizationImages(images: BudgetOptimizationImage[]): boolean {
  try {
    localStorage.setItem('budgetOptimizationImages', JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('予算最適化画像リストの保存に失敗しました:', error);
    return false;
  }
}

/**
 * 画像をダウンロード
 */
export function downloadImage(image: StoredImage | BudgetOptimizationImage, customName?: string): void {
  try {
    const link = document.createElement('a');
    link.href = image.dataUrl;
    
    // ファイル名を設定（予算最適化番号 + 元のファイル名）
    let fileName = customName || image.originalName;
    if ('budgetNumber' in image && image.budgetNumber > 0) {
      const extension = image.originalName.split('.').pop() || 'jpg';
      fileName = `${image.budgetNumber.toString().padStart(3, '0')}_${image.originalName}`;
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('画像のダウンロードに失敗しました:', error);
  }
}

/**
 * 複数画像を一括ダウンロード（ZIP形式）
 */
export async function downloadMultipleImagesAsZip(
  images: (StoredImage | BudgetOptimizationImage)[],
  zipFileName: string = 'budget_optimization_images.zip'
): Promise<void> {
  try {
    // JSZipライブラリが必要（必要に応じてインストール）
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    images.forEach((image, index) => {
      let fileName = image.originalName;
      if ('budgetNumber' in image && image.budgetNumber > 0) {
        const extension = image.originalName.split('.').pop() || 'jpg';
        fileName = `${image.budgetNumber.toString().padStart(3, '0')}_${image.originalName}`;
      }
      
      // dataURLからバイナリデータを抽出
      const base64Data = image.dataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      zip.file(fileName, bytes);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('ZIPダウンロードに失敗しました:', error);
    // フォールバック: 個別ダウンロード
    images.forEach(image => downloadImage(image));
  }
}

/**
 * ストレージの使用量を取得（MB単位）
 */
export function getStorageUsage(): number {
  try {
    const images = getAllStoredImages();
    let totalSize = 0;
    
    images.forEach(img => {
      // dataURLのサイズを概算（base64エンコーディングのオーバーヘッドを考慮）
      const base64Size = img.dataUrl.length;
      totalSize += Math.ceil(base64Size * 0.75); // base64は約33%のオーバーヘッド
    });
    
    return Math.round(totalSize / (1024 * 1024) * 100) / 100; // MB単位
  } catch (error) {
    console.error('ストレージ使用量の計算に失敗しました:', error);
    return 0;
  }
}

/**
 * 古い画像をクリーンアップ（指定日数より古い画像を削除）
 */
export function cleanupOldImages(daysOld: number = 30): number {
  try {
    const images = getAllStoredImages();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const oldImages = images.filter(img => img.timestamp < cutoffTime);
    
    oldImages.forEach(img => deleteImageFromStorage(img.id));
    
    return oldImages.length;
  } catch (error) {
    console.error('古い画像のクリーンアップに失敗しました:', error);
    return 0;
  }
}

// プライベート関数

function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveToLocalStorage(image: StoredImage): void {
  try {
    const images = getAllStoredImages();
    images.push(image);
    localStorage.setItem('storedImages', JSON.stringify(images));
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗しました:', error);
    throw error;
  }
}
