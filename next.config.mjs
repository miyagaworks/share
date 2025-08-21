/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },

  images: {
    domains: ['lh3.googleusercontent.com', 'storage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 本番環境のみでコンソール最適化
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error'],
          }
        : false,
  },

  // webpack設定から開発時の警告を削除
  webpack: (config, { dev, isServer }) => {
    // 開発環境でのdevtool設定を削除（デフォルトを使用）
    // config.devtool = 'eval-source-map'; // この行を削除

    if (dev) {
      // プリロード関連の警告を軽減
      config.module.rules.push({
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      });
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com https://js.stripe.com https://maps.googleapis.com",
              "script-src-elem 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com https://maps.googleapis.com",
              "frame-src 'self' https://www.google.com https://www.recaptcha.net https://js.stripe.com https://www.google.com/maps/embed",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/qr/:slug',
        destination: '/profile/:slug',
      },
    ];
  },

  // 新しい形式に修正
  devIndicators: {
    position: 'bottom-right', // buildActivityPosition から position に変更
    // buildActivity と buildActivityPosition を削除
  },

  productionBrowserSourceMaps: false,
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;