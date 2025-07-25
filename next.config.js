/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  typescript: {
    // Vercelデプロイ時に型チェックエラーでビルドを停止しない
    ignoreBuildErrors: true,
  },
  eslint: {
    // Vercelデプロイ時にESLintエラーでビルドを停止しない
    ignoreDuringBuilds: true,
  },
  experimental: {
    // 最適化設定
    optimizeCss: true,
  },
  // 静的ファイルの最適化
  compress: true,
  poweredByHeader: false,
  // 環境変数の設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 
