// 日付関連のユーティリティ関数





/**
 * 現在の年月を文字列で取得 (YYYY-MM形式)
 * @returns string
 */
export const getCurrentYearMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * 日付文字列をフォーマット
 * @param dateString - 日付文字列
 * @param format - フォーマット ('YYYY-MM-DD', 'YYYY/MM/DD'など)
 * @returns string
 */
export const formatDate = (dateString: string, format: string = 'YYYY-MM-DD'): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day);
};

/**
 * 日付が有効かチェック
 * @param dateString - 日付文字列
 * @returns boolean
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * 2つの日付の間の日数を計算
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns number
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 
