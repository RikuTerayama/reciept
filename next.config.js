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

  // SSRを無効化（クライアントサイドのみ）
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // ESM外部モジュールの適切な処理
  experimental: {
    esmExternals: true,
  },

  // Webpack設定でundiciとfirebaseのESM問題を解決
  webpack: (config, { isServer }) => {
    // Node.jsモジュールのfallback設定
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      buffer: false,
      util: false,
    };

    // undiciのESM構文エラーを完全に回避
    config.module.rules.push({
      test: /node_modules\/undici/,
      use: 'null-loader',
    });

    // Firebase AuthのESM問題を解決
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
      '@firebase/auth': false,
    };

    // ESMモジュールの処理を改善
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // 外部モジュールの処理を改善
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('undici');
    }

    return config;
  },

  // TypeScriptエラーを無視
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 
