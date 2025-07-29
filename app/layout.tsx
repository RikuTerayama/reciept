import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expenscan - レシート経費管理システム',
  description: 'OCR技術を使用したレシート・領収書の経費管理システム。画像から自動で経費情報を抽出し、予算最適化とExcel出力機能を提供します。',
  keywords: '経費管理, OCR, レシート, 領収書, 予算最適化, Expenscan, 経費管理システム',
  authors: [{ name: 'Expenscan Team' }],
  openGraph: {
    title: 'Expenscan - レシート経費管理システム',
    description: 'OCR技術を使用したレシート・領収書の経費管理システム',
    url: 'https://expenscan-receipt-manager.vercel.app',
    siteName: 'Expenscan',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Expenscan - レシート経費管理システム',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expenscan - レシート経費管理システム',
    description: 'OCR技術を使用したレシート・領収書の経費管理システム',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
