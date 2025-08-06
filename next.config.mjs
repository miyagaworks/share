// next.config.mjs - 本番最適化設定（修正版）
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  reactStrictMode: false, // 本番では無効化

  // パフォーマンス最適化
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'lucide-react', '@heroicons/react', 'react-hook-form'],
    forceSwcTransforms: true,
    swcTraceProfiling: false, // 本番では無効
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // 🔧 本番用コンパイラ設定（console.log除去）
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'], // error, warnのみ残す
          }
        : false,
  },

  // 🔧 セキュリティヘッダー（本番用）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // 本番用CSP（reCAPTCHA対応）
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://www.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net",
              "frame-src 'self' https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;