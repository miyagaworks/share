/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'server'から'standalone'に変更（Vercelで有効な値）
  output: 'standalone',

  // 画像最適化 - 既存の設定を維持
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // TypeScriptの設定
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },

  // ESLintの設定 - ビルド中に無視
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 実験的機能
  experimental: {
    // 既存の設定
    turbotrace: {
      logLevel: 'error',
    },
    // styled-jsxのサポートを追加
    transpilePackages: ['styled-jsx'],
  },

  // webpack設定 - ES Modulesに対応した書き方に変更
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }

    // プロダクションビルドでのバンドルサイズ最適化
    if (process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
        },
      };
    }

    // styled-jsxの設定 - requireを使わない方法に変更
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // ES Modules形式で書く
        'styled-jsx/style': 'styled-jsx/style',
      };
    }

    return config;
  },

  // CSPヘッダーを追加 - unsafe-evalを含める
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
            ].join('; '),
          },
          // 他のヘッダー設定
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // 静的アセットのキャッシュ設定
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;