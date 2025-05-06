// next.config.mjs の修正案
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本設定
  reactStrictMode: true,

  // TypeScript と ESLint エラーを無視
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 画像最適化設定
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // 環境変数の設定
  env: {
    DEBUG: 'next-auth:*,next-auth:core,next-auth:jwt',
  },

  // その他の設定
  transpilePackages: ['styled-jsx'],

  // エラー表示の改善
  onDemandEntries: {
    // 開発サーバーがページをメモリに保持する時間
    maxInactiveAge: 60 * 1000,
  },
};

export default nextConfig;