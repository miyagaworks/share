// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコードデザイナー | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
  applicationName: 'Share QR Code',
  // カスタムタグを追加（Next.jsのMetadataでサポートされていない場合）
  other: {
    // PWA関連の追加メタタグ
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'My QR Code',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My QR Code',
    startupImage: [
      {
        url: '/pwa/apple-splash.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function QrCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 重要：headタグ内に直接マニフェストリンクを追加 */}
      <head>
        <link rel="manifest" href="/qrcode-manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR Code" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
      </head>

      {/* PWA用のインラインスクリプト追加 */}
      <Script id="pwa-start-url-fix" strategy="beforeInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              // PWAとして実行されているか確認
              if (window.matchMedia('(display-mode: standalone)').matches) {
                // ホーム画面からの起動時は常にQRコードページに遷移
                if (window.location.pathname !== '/qrcode') {
                  window.location.href = '/qrcode';
                }
              }
            });
          }
        `}
      </Script>

      {children}
    </>
  );
}