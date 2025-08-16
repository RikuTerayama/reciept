import { ErrorWithMessage } from '@/types';

/**
 * エラーを適切な形式に変換する
 */
export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (maybeError instanceof Error) {
    return {
      message: maybeError.message,
      code: (maybeError as any).code,
      details: maybeError
    };
  }

  if (typeof maybeError === 'string') {
    return {
      message: maybeError,
      code: 'UNKNOWN_ERROR'
    };
  }

  if (maybeError && typeof maybeError === 'object' && 'message' in maybeError) {
    return {
      message: String((maybeError as any).message),
      code: (maybeError as any).code,
      details: maybeError
    };
  }

  return {
    message: '不明なエラーが発生しました',
    code: 'UNKNOWN_ERROR',
    details: maybeError
  };
}

/**
 * エラーメッセージをユーザーフレンドリーに変換する
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const errorWithMessage = toErrorWithMessage(error);
  
  // 特定のエラーコードに対するメッセージ
  switch (errorWithMessage.code) {
    case 'auth/user-not-found':
      return 'ユーザーが見つかりません';
    case 'auth/wrong-password':
      return 'パスワードが正しくありません';
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/weak-password':
      return 'パスワードが弱すぎます';
    case 'auth/invalid-email':
      return '無効なメールアドレスです';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください';
    case 'auth/too-many-requests':
      return 'リクエストが多すぎます。しばらく待ってから再試行してください';
    case 'permission-denied':
      return 'アクセス権限がありません';
    case 'not-found':
      return 'リソースが見つかりません';
    case 'unavailable':
      return 'サービスが利用できません';
    case 'deadline-exceeded':
      return '処理がタイムアウトしました';
    case 'resource-exhausted':
      return 'リソースが不足しています';
    case 'failed-precondition':
      return '前提条件が満たされていません';
    case 'aborted':
      return '処理が中断されました';
    case 'out-of-range':
      return '範囲外の値です';
    case 'unimplemented':
      return '実装されていない機能です';
    case 'internal':
      return '内部エラーが発生しました';
    case 'data-loss':
      return 'データが失われました';
    case 'unauthenticated':
      return '認証が必要です';
    default:
      return errorWithMessage.message || '不明なエラーが発生しました';
  }
}

/**
 * エラーをログに記録する
 */
export function logError(error: unknown, context?: string): void {
  const errorWithMessage = toErrorWithMessage(error);
  
  console.error(`[${context || 'ERROR'}]`, {
    message: errorWithMessage.message,
    code: errorWithMessage.code,
    details: errorWithMessage.details,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  });
}

/**
 * エラーを安全に処理する
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * エラーを安全に処理し、結果を返す
 */
export async function safeExecuteWithResult<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorMessage = getUserFriendlyErrorMessage(error);
    logError(error, context);
    return { success: false, error: errorMessage };
  }
}
