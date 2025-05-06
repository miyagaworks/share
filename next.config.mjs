/** @type {import('next').NextConfig} */
const nextConfig = {
  // 出力を最適化して静的なHTMLをキャッシュ
  output: 'standalone',

  // 画像最適化
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'], // 必要な外部ドメインのみを指定
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 本番ビルドではTypeScriptエラーをチェック
  typescript: {
    // 本番環境では型チェックを有効にする
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },

  // 本番ビルドではESLintチェックを有効
  eslint: {
    // 本番環境ではESLintチェックを有効にする
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  // ビルドキャッシュを有効化
  experimental: {
    // ビルドキャッシュを有効化
    turbotrace: {
      logLevel: 'error',
    },
  },

  // webpack設定の最適化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }

    // プロダクションビルドでのバンドルサイズ最適化
    if (process.env.NODE_ENV === 'production') {
      // コード分割と最適化
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

    return config;
  },

  // 高度なヘッダー設定（セキュリティとキャッシュ）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
            ].join('; '),
          },
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