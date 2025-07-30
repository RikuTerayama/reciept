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

  // TypeScriptエラーを無視
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 
