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
  // 静的ファイルの最適化
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig 
