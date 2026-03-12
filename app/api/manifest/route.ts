// app/api/manifest/route.ts
// PWA manifest を動的生成するRoute Handler（月額型: パートナーごとにブランド切替）
import { NextRequest, NextResponse } from 'next/server';
import { resolveBrandByHostname, resolveBrandByPartnerId } from '@/lib/brand/resolve';

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const partnerId = request.headers.get('x-partner-id');

  // x-partner-id ヘッダーがあればそれを優先、なければホスト名ベースで解決
  const brand = partnerId
    ? await resolveBrandByPartnerId(partnerId)
    : await resolveBrandByHostname(hostname);

  const manifest = {
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

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
