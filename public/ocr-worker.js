// OCR処理用Web Worker
importScripts('https://unpkg.com/tesseract.js@v4.1.1/dist/tesseract.min.js');

self.onmessage = async function(e) {
  const { file, id } = e.data;
  
  try {
    // 画像をBlobに変換
    const blob = new Blob([file], { type: file.type });
    const imageUrl = URL.createObjectURL(blob);
    
    // TesseractでOCR処理
    const result = await Tesseract.recognize(imageUrl, 'jpn+eng', {
      logger: (m) => {
        // 進捗をメインスレッドに送信
        self.postMessage({
          type: 'progress',
          id: id,
          progress: m.progress || 0,
          status: m.status
        });
      },
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン年月日時分秒円¥￥,./\\-:：',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      tessedit_do_invert: '0',
      tessedit_image_border: '0',
      tessedit_adaptive_threshold: '1',
      tessedit_adaptive_method: '1'
    });
    
    // 結果をメインスレッドに送信
    self.postMessage({
      type: 'complete',
      id: id,
      result: result.data.text
    });
    
    URL.revokeObjectURL(imageUrl);
  } catch (error) {
    // エラーをメインスレッドに送信
    self.postMessage({
      type: 'error',
      id: id,
      error: error.message
    });
  }
}; 
