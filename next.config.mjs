/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // TypeScript型チェックエラーを無視する設定
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLintエラーも無視する（オプション）
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;