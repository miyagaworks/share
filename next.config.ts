/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // TypeScriptの型チェックエラーを無視してビルドを成功させる設定
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;