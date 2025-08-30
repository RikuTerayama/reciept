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
    // Vercel用の最適化
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  
  // 静的エクスポートを無効化してSSRのみ使用
  output: undefined,
  
  // ビルド最適化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // パス解決の最適化
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // ディレクトリ構造の明示的指定
  distDir: '.next',
  
  // 静的ファイルの最適化
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
    
    // パス解決の優先順位を明示的に設定
    config.resolve.modules = [
      require('path').resolve(__dirname, 'src'),
      'node_modules'
    ];
    
    // ファイル拡張子の解決順序を最適化
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];

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


  
  // ビルド設定
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 
