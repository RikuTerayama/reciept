import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expenscan - レシート経費管理システム',
  description: 'OCR技術を使用したレシート・領収書の経費管理システム。画像から自動で経費情報を抽出し、予算最適化とExcel出力機能を提供します。',
  keywords: '経費管理, OCR, レシート, 領収書, 予算最適化, Expenscan, 経費管理システム',
  authors: [{ name: 'Expenscan Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="msapplication-TileColor" content="#1a1a1a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 
