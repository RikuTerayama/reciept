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
  
  // 金額
  let amount: number | undefined;
  const yen1 = text.match(/([\d,\.]+)\s*円?/);
  if (yen1) amount = toNumber(yen1[1]);

  if (!amount) {
    const kan = text.match(/([〇一二三四五六七八九十百千万]+)\s*円/);
    if (kan) amount = kanjiToNumber(kan[1]);
  }

  // 日付
  const y = today.getFullYear();
  const mdy = text.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日/);
  const md = text.match(/(\d{1,2})[\/\-](\d{1,2})/);
  let dateStr: string | undefined;

  if (mdy) {
    const yy = mdy[1] ? Number(mdy[1]) : y;
    const mm = Number(mdy[2]);
    const dd = Number(mdy[3]);
    dateStr = `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  } else if (md) {
    const mm = Number(md[1]);
    const dd = Number(md[2]);
    dateStr = `${y}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }

  return { date: dateStr, amount };
}
