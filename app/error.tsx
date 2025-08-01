'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-900 rounded-lg p-8 border border-surface-700 shadow-xl">
        <div className="text-center">
          {/* エラーアイコン */}
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          {/* エラーメッセージ */}
          <h1 className="text-2xl font-bold text-white mb-4">
            申し訳ございません
          </h1>
          <p className="text-surface-400 mb-6">
            予期しないエラーが発生しました。<br />
            しばらく時間をおいてから再度お試しください。
          </p>
          
          {/* エラー詳細（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-surface-400 cursor-pointer hover:text-surface-300 mb-2">
                エラー詳細（開発者向け）
              </summary>
              <div className="bg-surface-800 rounded p-3 text-xs text-surface-400 font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                  </div>
                )}
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
              </div>
            </details>
          )}
          
          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              再試行
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 hover:text-white transition-colors duration-200 font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              ホームに戻る
            </button>
          </div>
          
          {/* サポート情報 */}
          <div className="mt-8 pt-6 border-t border-surface-700">
            <p className="text-xs text-surface-500">
              問題が解決しない場合は、<br />
              お手数ですがページを再読み込みしてください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
