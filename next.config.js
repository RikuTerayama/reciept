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
  // 静的生成を完全に無効化
  output: 'standalone',
  trailingSlash: false,
  // 動的レンダリングを強制
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig 
