'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* エラーアイコン */}
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* エラーメッセージ */}
        <h1 className="text-2xl font-bold text-white mb-4">
          予期しないエラーが発生しました
        </h1>
        
        <p className="text-surface-400 mb-6">
          申し訳ございませんが、アプリケーションでエラーが発生しました。
          しばらく時間をおいてから再度お試しください。
        </p>

        {/* エラー詳細（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="text-sm text-surface-400 cursor-pointer hover:text-surface-300 mb-2">
              エラー詳細（開発者向け）
            </summary>
            <div className="bg-surface-800 rounded-lg p-4 text-xs font-mono text-surface-300 overflow-auto">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.digest && (
                <div className="mb-2">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
              <div>
                <strong>Stack:</strong>
                <pre className="mt-2 text-xs overflow-auto">
                  {error.stack}
                </pre>
              </div>
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
            再読み込み
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 hover:text-white transition-colors duration-200 font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            ホームに戻る
          </button>
        </div>

        {/* 追加情報 */}
        <div className="mt-8 text-sm text-surface-500">
          <p className="mb-2">
            問題が解決しない場合は、以下をお試しください：
          </p>
          <ul className="text-left space-y-1">
            <li>• ブラウザのキャッシュをクリアする</li>
            <li>• 別のブラウザでアクセスする</li>
            <li>• しばらく時間をおいてから再度アクセスする</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
