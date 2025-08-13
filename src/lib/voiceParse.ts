const z2h = (s: string) => s.replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

const toNumber = (raw: string) => {
  const t = z2h(raw).replace(/[^\d.]/g, '');
  return t ? Number(t) : NaN;
};

// ざっくり漢数字→桁変換（簡易）
function kanjiToNumber(s: string): number {
  // 万・千・百・十 に対応する簡易版
  let n = 0;
  const unit = { 万: 10000, 千: 1000, 百: 100, 十: 10 };
  let cur = 0;
  for (const ch of s) {
    if (ch in unit) { 
      n += (cur || 1) * (unit as any)[ch]; 
      cur = 0; 
    }
    else if (/[〇一二三四五六七八九0-9]/.test(ch)) {
      const map: any = { 〇:0, 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
      cur = cur * 10 + (map[ch] ?? Number(ch));
    }
  }
  n += cur;
  return n;
}

export function parseJaSpeechToDateAmount(speech: string, today = new Date()) {
  const text = z2h(speech).replace(/\s+/g, '');
  let amount: number | undefined;
  let category: string | undefined;
  let description: string | undefined;
  
  // 金額の抽出（複数のパターンに対応）
  const amountPatterns = [
    // 数字 + 円
    /([\d,\.]+)\s*円?/,
    // 漢数字 + 円
    /([〇一二三四五六七八九十百千万]+)\s*円/,
    // 万、千、百の組み合わせ
    /(\d+)万(\d+)千(\d+)百(\d+)円/,
    /(\d+)万(\d+)千(\d+)円/,
    /(\d+)万(\d+)円/,
    /(\d+)千(\d+)百(\d+)円/,
    /(\d+)千(\d+)円/,
    /(\d+)百(\d+)円/,
    // 英語表記
    /(\d+)\s*(yen|YEN|Yen)/i,
    // カンマ区切り
    /(\d{1,3}(?:,\d{3})*)\s*円?/
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('万') || pattern.source.includes('千') || pattern.source.includes('百')) {
        // 漢数字の組み合わせパターン
        amount = parseComplexAmount(match);
      } else {
        amount = toNumber(match[1]);
      }
      break;
    }
  }
  
  // 日付の抽出（複数のパターンに対応）
  const datePatterns = [
    // 年月日
    /(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日/,
    // 月/日 または 月-日
    /(\d{1,2})[\/\-](\d{1,2})/,
    // 今日、明日、昨日
    /(今日|明日|昨日|きょう|あした|きのう)/,
    // 英語表記
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
    // 短縮形
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i
  ];
  
  let dateStr: string | undefined;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      dateStr = parseDateFromMatch(match, pattern, today);
      break;
    }
  }
  
  // カテゴリの抽出
  const categoryPatterns = [
    /(交通費|タクシー|電車|バス|飛行機|ガソリン|駐車場)/,
    /(食事|ランチ|ディナー|朝食|昼食|夕食|カフェ|レストラン)/,
    /(宿泊|ホテル|旅館|民宿)/,
    /(会議|打ち合わせ|商談|プレゼン)/,
    /(印刷|コピー|文具|オフィス用品)/,
    /(通信費|電話|インターネット|WiFi)/,
    /(保険|医療|薬)/,
    /(研修|セミナー|勉強会|資格)/,
    /(接待|交際費|贈答品)/,
    /(その他|雑費|消耗品)/
  ];
  
  for (const pattern of categoryPatterns) {
    const match = text.match(pattern);
    if (match) {
      category = match[1];
      break;
    }
  }
  
  // 説明の抽出（金額や日付以外の部分）
  const amountText = amount ? text.replace(new RegExp(`.*${amount}.*円?.*`, 'i'), '') : text;
  const dateText = dateStr ? text.replace(new RegExp(`.*${dateStr}.*`, 'i'), '') : text;
  description = (amountText + ' ' + dateText).trim().replace(/\s+/g, ' ');
  
  return { 
    date: dateStr, 
    amount, 
    category,
    description: description || undefined
  };
}

// 複雑な金額パターンの解析
function parseComplexAmount(match: RegExpMatchArray): number {
  if (match.length >= 5) {
    // 万千百円のパターン
    const man = parseInt(match[1]) * 10000;
    const sen = parseInt(match[2]) * 1000;
    const hyaku = parseInt(match[3]) * 100;
    const en = parseInt(match[4]);
    return man + sen + hyaku + en;
  } else if (match.length >= 4) {
    // 万千円のパターン
    const man = parseInt(match[1]) * 10000;
    const sen = parseInt(match[2]) * 1000;
    const en = parseInt(match[3]);
    return man + sen + en;
  } else if (match.length >= 3) {
    // 万円のパターン
    const man = parseInt(match[1]) * 10000;
    const en = parseInt(match[2]);
    return man + en;
  }
  return 0;
}

// 日付マッチから日付文字列を生成
function parseDateFromMatch(match: RegExpMatchArray, pattern: RegExp, today: Date): string {
  const y = today.getFullYear();
  
  if (pattern.source.includes('今日|明日|昨日|きょう|あした|きのう')) {
    const relativeDate = match[1];
    const date = new Date(today);
    
    if (relativeDate.includes('明日') || relativeDate.includes('あした')) {
      date.setDate(date.getDate() + 1);
    } else if (relativeDate.includes('昨日') || relativeDate.includes('きのう')) {
      date.setDate(date.getDate() - 1);
    }
    // 今日の場合はtodayを使用
    
    return date.toISOString().split('T')[0];
  }
  
  if (pattern.source.includes('january|february|march|april|may|june|july|august|september|october|november|december')) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const month = monthNames.findIndex(m => m.toLowerCase() === match[1].toLowerCase()) + 1;
    const day = parseInt(match[2]);
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  if (pattern.source.includes('jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec')) {
    const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthAbbr.findIndex(m => m.toLowerCase() === match[1].toLowerCase()) + 1;
    const day = parseInt(match[2]);
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  if (match.length >= 4) {
    // 年月日のパターン
    const yy = match[1] ? Number(match[1]) : y;
    const mm = Number(match[2]);
    const dd = Number(match[3]);
    return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  } else if (match.length >= 3) {
    // 月日のパターン
    const mm = Number(match[1]);
    const dd = Number(match[2]);
    return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }
  
  return '';
}
