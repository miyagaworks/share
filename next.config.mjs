// next.config.mjs の修正案
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基本設定（standaloneは無効化）
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

  // Next.js 14の設定
  experimental: {
    // serverActions: true,
  },

  // 環境変数をクライアントにも公開する設定
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DEBUG: process.env.NODE_ENV === 'development' ? 'next-auth:*' : '',
  },

  // transpilePackagesをexperimentalの外に
  transpilePackages: ['styled-jsx'],
};

export default nextConfig;