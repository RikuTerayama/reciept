/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercelデプロイ用の設定
  typescript: {
    ignoreBuildErrors: false, // ビルドエラーを検出
  },
  eslint: {
    ignoreDuringBuilds: false, // ESLintエラーを検出
  },
  // 静的ファイルの最適化
  compress: true,
  poweredByHeader: false,

  // Vercel用の設定（SSRを有効化）
  trailingSlash: false, // トレーリングスラッシュを無効化
  
  // 静的生成を無効化
  experimental: {
    esmExternals: true,
    // 静的生成を無効化
    workerThreads: false,
    cpus: 1,
    // 静的ページ生成のタイムアウトを設定
    staticPageGenerationTimeout: 0,
  },
  
  // ESM外部モジュールの適切な処理
  experimental: {
    esmExternals: true,
  },
  images: {
    unoptimized: true,
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

    // 依存関係の解決を確実にする
    config.resolve.modules = [
      ...config.resolve.modules || [],
      'node_modules'
    ];

    // パスエイリアスの設定（tsconfig.jsonのpathsと一致）
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
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

  // 静的ページ生成を無効化（SSRのみ使用）
  
  // ビルド設定
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 
