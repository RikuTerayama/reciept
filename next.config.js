/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercelデプロイ用の設定
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 静的ファイルの最適化
  compress: true,
  poweredByHeader: false,
  // 動的レンダリングを強制
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig 
