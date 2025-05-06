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

  // transpilePackagesをexperimentalの外に
  transpilePackages: ['styled-jsx'],
};

export default nextConfig;
