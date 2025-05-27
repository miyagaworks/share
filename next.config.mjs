// next.config.mjs (修正版) - 既存の設定を保持しつつ追加
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本設定
  reactStrictMode: true,

  // 実験的機能
  experimental: {
    // CSS最適化
    optimizeCss: true,
    // パッケージインポート最適化
    optimizePackageImports: ['react-icons', 'lucide-react', '@heroicons/react', 'react-hook-form'],
    // 🔧 Stripe関連パッケージの外部化
    serverComponentsExternalPackages: ['stripe'],
  },

  // TypeScript と ESLint 設定
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🔧 修正：画像最適化設定（remotePatterns使用）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**', // その他のドメイン
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 🔧 バンドル最適化（Stripe警告対応）
  webpack: (config, { isServer, dev }) => {
    // 🔧 Stripe関連の警告を抑制
    if (dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // プロダクションビルドでの最適化
    if (!dev && !isServer) {
      // チャンク分割の最適化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // フレームワークチャンク
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // ライブラリチャンク
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const packageNameMatch = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              const packageName = packageNameMatch ? packageNameMatch[1] : '';
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // コモンチャンク
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
          // デフォルト
          default: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // 圧縮とキャッシュ設定
  compress: true,
  poweredByHeader: false,

  // 🔧 環境変数（デバッグモード制御）
  env: {
    DEBUG: process.env.NODE_ENV === 'development' ? '' : '', // デバッグログを抑制
    PRISMA_CONNECTION_LIMIT: '10',
    PRISMA_CONNECTION_TIMEOUT: '5000',
  },

  // ヘッダー設定（セキュリティとキャッシュ）
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // リダイレクト設定を修正
  async redirects() {
    return [
      // 無限リダイレクトを避けるため削除
    ];
  },

  // サーバーランタイム設定
  serverRuntimeConfig: {
    prisma: {
      connectionLimit: process.env.PRISMA_CONNECTION_LIMIT || 10,
      connectionTimeout: process.env.PRISMA_CONNECTION_TIMEOUT || 5000,
      connectionRetryCount: 3,
    },
  },

  // その他の最適化
  transpilePackages: ['styled-jsx'],
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;