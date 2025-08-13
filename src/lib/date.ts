// src/lib/date.ts
export const getMonthKey = (isoDate: string) => isoDate?.slice(0, 7) || '';

// 現在の月キーを取得
export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// 月キーが有効かチェック
export const isValidMonthKey = (monthKey: string) => {
  return /^\d{4}-\d{2}$/.test(monthKey);
};

// 月キーから年月を取得
export const parseMonthKey = (monthKey: string) => {
  if (!isValidMonthKey(monthKey)) return null;
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
};
