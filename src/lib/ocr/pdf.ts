/**
 * PDFファイルをCanvasに変換
 * - 高品質レンダリング
 * - 適切なスケーリング
 * - メモリ効率化
 */

export interface PdfOptions {
  page?: number;
  scale?: number;
  maxDimension?: number;
  enableAntiAliasing?: boolean;
}

/**
 * PDFファイルをCanvasに変換
 */
export const processPdf = async (
  file: File,
  options: PdfOptions = {}
): Promise<HTMLCanvasElement> => {
  const {
    page = 1,
    scale = 1.5,
    maxDimension = 1800,
    enableAntiAliasing = true
  } = options;

  try {
    // PDF.jsの動的インポート
    const pdfjsLib = await import('pdfjs-dist') as any;
    
    // PDF.jsのワーカー設定
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    // PDFファイルを読み込み
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true
    }).promise;
    
    // 指定されたページを取得
    const targetPage = Math.min(page, pdf.numPages);
    const pdfPage = await pdf.getPage(targetPage);
    
    // ビューポートを作成（初期スケール）
    const viewport = pdfPage.getViewport({ scale });
    
    // Canvasを作成
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // 高品質設定
    if (enableAntiAliasing) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // ページをCanvasにレンダリング
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      enableWebGL: false, // 安定性のためWebGLは無効
      renderInteractiveForms: false
    };
    
    await pdfPage.render(renderContext).promise;
    
    // 解像度を適切に制限
    const finalCanvas = limitCanvasDimensions(canvas, maxDimension);
    
    return finalCanvas;
    
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDFファイルの処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

/**
 * Canvasの解像度を制限
 */
const limitCanvasDimensions = (
  canvas: HTMLCanvasElement, 
  maxDimension: number
): HTMLCanvasElement => {
  const { width, height } = canvas;
  const maxSide = Math.max(width, height);
  
  if (maxSide <= maxDimension) {
    return canvas;
  }
  
  // アスペクト比を保ってリサイズ
  const scale = maxDimension / maxSide;
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);
  
  const resizedCanvas = document.createElement('canvas');
  const ctx = resizedCanvas.getContext('2d')!;
  
  // 高品質設定
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  resizedCanvas.width = newWidth;
  resizedCanvas.height = newHeight;
  
  // リサイズ
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  return resizedCanvas;
};

/**
 * PDFの情報を取得（メタデータ、ページ数など）
 */
export const getPdfInfo = async (file: File): Promise<{
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creationDate?: string;
}> => {
  try {
    const pdfjsLib = await import('pdfjs-dist') as any;
    
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const metadata = await pdf.getMetadata().catch(() => null);
    
    return {
      numPages: pdf.numPages,
      title: metadata?.info?.Title,
      author: metadata?.info?.Author,
      subject: metadata?.info?.Subject,
      creationDate: metadata?.info?.CreationDate
    };
    
  } catch (error) {
    console.error('PDF info error:', error);
    throw new Error('PDFファイルの情報取得に失敗しました');
  }
};

/**
 * 複数ページのPDFを処理（サムネイル生成など）
 */
export const processPdfPages = async (
  file: File,
  pages: number[],
  options: Omit<PdfOptions, 'page'> = {}
): Promise<HTMLCanvasElement[]> => {
  const results: HTMLCanvasElement[] = [];
  
  for (const pageNum of pages) {
    try {
      const canvas = await processPdf(file, { ...options, page: pageNum });
      results.push(canvas);
    } catch (error) {
      console.error(`Page ${pageNum} processing error:`, error);
      // エラーが発生したページはスキップ
      continue;
    }
  }
  
  return results;
};
