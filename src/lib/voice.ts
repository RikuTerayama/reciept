/**
 * 音声認識ユーティリティ
 */

// Web Speech APIの型定義
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    SpeechGrammarList: any;
  }
}

export function createSpeechRecognizer() {
  const SR: any = (typeof window !== 'undefined') && (window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  if (!SR) return { supported: false } as const;

  const recognition = new SR();
  
  // 高度な音声認識設定
  recognition.lang = 'ja-JP';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 5; // 複数の候補を取得
  
  // 音声認識の精度向上設定
  if (recognition.grammars) {
    // カスタム文法を設定（経費関連の語彙に特化）
    const grammar = new (window as any).SpeechGrammarList();
    grammar.addFromString(`
      #JSGF V1.0;
      grammar expense;
      
      public <date> = 
        <year>年<month>月<day>日 |
        <month>月<day>日 |
        <month>/<day> |
        <month>-<day>;
      
      <year> = 2024 | 2025 | 2026;
      <month> = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09;
      <day> = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09;
      
      public <amount> = 
        <number>円 |
        <number>万<number>千<number>百円 |
        <number>万<number>千円 |
        <number>万円 |
        <number>千<number>百円 |
        <number>千円 |
        <number>百円;
      
      <number> = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 〇 | 一 | 二 | 三 | 四 | 五 | 六 | 七 | 八 | 九;
    `, 1.0);
    recognition.grammars = grammar;
  }

  return {
    supported: true as const,
    start: () => new Promise<string>((resolve, reject) => {
      let finalText = '';
      let interimText = '';
      let confidence = 0;
      let alternatives: string[] = [];
      
      recognition.onresult = (e: any) => {
        interimText = '';
        
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          
          if (res.isFinal) {
            finalText += res[0].transcript;
            confidence = Math.max(confidence, res[0].confidence);
            
            // 代替候補を収集
            for (let j = 0; j < res.length; j++) {
              if (res[j].confidence > 0.3) { // 信頼度が30%以上の候補のみ
                alternatives.push(res[j].transcript);
              }
            }
          } else {
            interimText += res[0].transcript;
          }
        }
        
        // 中間結果の表示（UI更新用）
        if (interimText) {
          recognition.dispatchEvent(new CustomEvent('interimresult', {
            detail: { text: interimText, confidence: e.results[e.resultIndex]?.[0]?.confidence || 0 }
          }));
        }
      };
      
      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        reject(e.error || 'speech_error');
      };
      
      recognition.onend = () => {
        // 最終結果の後処理
        const processedText = postProcessSpeechText(finalText, alternatives);
        resolve(processedText.trim());
      };
      
      recognition.start();
    }),
    stop: () => recognition.stop(),
    
    // 音声認識の状態監視
    onInterimResult: (callback: (text: string, confidence: number) => void) => {
      recognition.addEventListener('interimresult', (e: any) => {
        callback(e.detail.text, e.detail.confidence);
      });
    }
  };
}

// 音声テキストの後処理（ノイズ除去、正規化）
function postProcessSpeechText(text: string, alternatives: string[]): string {
  let processed = text;
  
  // 一般的な音声認識エラーの修正
  const commonCorrections: Record<string, string> = {
    'きょう': '今日',
    'あした': '明日',
    'きのう': '昨日',
    'えん': '円',
    'まん': '万',
    'せん': '千',
    'ひゃく': '百',
    'いち': '1',
    'に': '2',
    'さん': '3',
    'よん': '4',
    'ご': '5',
    'ろく': '6',
    'なな': '7',
    'はち': '8',
    'きゅう': '9'
  };
  
  // 修正を適用
  Object.entries(commonCorrections).forEach(([wrong, correct]) => {
    processed = processed.replace(new RegExp(wrong, 'g'), correct);
  });
  
  // 数字の正規化
  processed = processed.replace(/(\d+)まん(\d+)せん(\d+)ひゃく(\d+)円/g, '$1万$2千$3百$4円');
  processed = processed.replace(/(\d+)まん(\d+)せん(\d+)円/g, '$1万$2千$3円');
  processed = processed.replace(/(\d+)まん(\d+)円/g, '$1万$2円');
  processed = processed.replace(/(\d+)せん(\d+)ひゃく(\d+)円/g, '$1千$2百$3円');
  processed = processed.replace(/(\d+)せん(\d+)円/g, '$1千$2円');
  processed = processed.replace(/(\d+)ひゃく(\d+)円/g, '$1百$2円');
  
  // 日付の正規化
  processed = processed.replace(/(\d+)ねん(\d+)がつ(\d+)にち/g, '$1年$2月$3日');
  processed = processed.replace(/(\d+)がつ(\d+)にち/g, '$1月$2日');
  
  // 余分な空白と改行を除去
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
}
