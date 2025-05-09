// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本設定（既存）
  reactStrictMode: true,

  // TypeScript と ESLint エラーを無視（既存）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 画像最適化設定（既存）
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // サーバーランタイム設定を追加（新規）
  serverRuntimeConfig: {
    // データベース接続プールの設定
    prisma: {
      // 同時接続数の制限（supabaseの接続上限を考慮）
      connectionLimit: process.env.PRISMA_CONNECTION_LIMIT || 10,
      // 接続タイムアウト
      connectionTimeout: process.env.PRISMA_CONNECTION_TIMEOUT || 5000,
      // 接続リトライ回数
      connectionRetryCount: 3,
    },
  },

  // 環境変数の設定（既存）
  env: {
    DEBUG: 'next-auth:*,next-auth:core,next-auth:jwt',
    // Prisma接続管理の環境変数を追加（新規）
    PRISMA_CONNECTION_LIMIT: 10,
    PRISMA_CONNECTION_TIMEOUT: 5000,
  },

  // その他の設定（既存）
  transpilePackages: ['styled-jsx'],

  // エラー表示の改善（既存）
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
  },
};

export default nextConfig;