// next.config.mjs (PWA対応版)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 既存の設定はそのまま保持...
  reactStrictMode: true,

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'lucide-react', '@heroicons/react', 'react-hook-form'],
    serverComponentsExternalPackages: ['stripe'],
    forceSwcTransforms: true,
    swcTraceProfiling: false,
    turbotrace: {
      logLevel: 'error',
    },
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

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
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack: (config, { isServer, dev }) => {
    if (dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000,
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 120000 && /node_modules[/\\]/.test(module.identifier());
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
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };

      // 本番環境でのパフォーマンス最適化
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  compress: true,
  poweredByHeader: false,

  env: {
    PRISMA_CONNECTION_LIMIT: '20',
    PRISMA_CONNECTION_TIMEOUT: '10000',
  },

  // 🔥 PWA対応: ヘッダー設定を修正
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
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // 🔥 PWA マニフェストファイルのヘッダー設定
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/qrcode-manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // 🔥 Service Worker のヘッダー設定
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/qr-sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  serverRuntimeConfig: {
    prisma: {
      connectionLimit: process.env.PRISMA_CONNECTION_LIMIT || 20,
      connectionTimeout: process.env.PRISMA_CONNECTION_TIMEOUT || 10000,
      connectionRetryCount: 5,
    },
  },

  transpilePackages: ['styled-jsx'],
  onDemandEntries: {
    maxInactiveAge: 300 * 1000,
    pagesBufferLength: 5,
  },

};

export default nextConfig;