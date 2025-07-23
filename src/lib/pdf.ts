// PDF処理用のユーティリティ
// 注意: この実装は簡易版です。本格的なPDF処理にはpdf.jsなどのライブラリが必要です

export async function convertPDFToImage(pdfFile: File): Promise<File> {
  // 簡易的な実装として、PDFファイルをそのまま返す
  // 実際の実装では、pdf.jsを使用してPDFの最初のページを画像に変換する必要があります
  
  return new Promise((resolve, reject) => {
    // 現在はPDF処理をサポートしていないため、エラーを返す
    reject(new Error('PDFファイルの処理は現在サポートされていません。画像ファイルをご利用ください。'));
  });
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function validatePDFFile(file: File): string[] {
  const errors: string[] = [];
  
  if (!isPDFFile(file)) {
    errors.push('PDFファイルではありません');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB制限
    errors.push('ファイルサイズが大きすぎます（10MB以下にしてください）');
  }
  
  return errors;
} 
