// app/qrcode-manifest.json/route.ts
// QRコード用 PWA manifest を動的生成（ホワイトラベル対応）
import { NextResponse } from 'next/server';
import { getBrandConfig } from '@/lib/brand/config';

export function GET() {
  const brand = getBrandConfig();
  const manifest = {
    name: 'QRコード共有',
    short_name: 'My QR',
    description: 'あなたのプロフィールをQRコードで共有',
    id: '/qr',
    start_url: '/qr',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: brand.primaryColor,
    icons: [
      {
        src: '/pwa/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/pwa/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
