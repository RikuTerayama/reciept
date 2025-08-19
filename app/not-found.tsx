import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* 404アイコン */}
        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-primary-500" />
        </div>

        {/* 404メッセージ */}
        <h1 className="text-6xl font-bold text-white mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-white mb-4">
          ページが見つかりません
        </h2>
        
        <p className="text-surface-400 mb-8">
          お探しのページは存在しないか、移動された可能性があります。<br />
          URLを確認するか、ホームページから再度お試しください。
        </p>

        {/* ナビゲーションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-6 py-3 bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 hover:text-white transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            前のページに戻る
          </button>
        </div>

        {/* 追加情報 */}
        <div className="mt-8 text-sm text-surface-500">
          <p className="mb-2">
            よく利用されるページ：
          </p>
          <ul className="text-center space-y-1">
            <li>
              <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
                • ホームページ
              </Link>
            </li>
            <li>
              <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
                • 経費管理
              </Link>
            </li>
            <li>
              <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
                • レシート登録
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
