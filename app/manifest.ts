// app/manifest.ts
// PWA manifest を動的生成（ホワイトラベル対応）
import type { MetadataRoute } from 'next';
import { getBrandConfig } from '@/lib/brand/config';

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrandConfig();
  return {
    name: brand.name,
    short_name: brand.name,
    description: `${brand.name} - デジタル名刺サービス`,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: brand.primaryColor,
    icons: [
      { src: '/pwa/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
