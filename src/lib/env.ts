/**
 * 環境変数の検証と型安全性を確保
 */

interface EnvironmentVariables {
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * 環境変数を検証する
 */
function validateEnvironmentVariables(): EnvironmentVariables {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ] as const;

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables['NODE_ENV']) || 'development'
  };
}

/**
 * 検証済みの環境変数を取得
 */
export const env = validateEnvironmentVariables();

/**
 * 開発環境かどうかを判定
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * 本番環境かどうかを判定
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * テスト環境かどうかを判定
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * 環境変数が正しく設定されているかチェック
 */
export function checkEnvironmentVariables(): boolean {
  try {
    validateEnvironmentVariables();
    return true;
  } catch {
    return false;
  }
}
