// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコード | Share',
  description: 'スタイリッシュなQRコードを作成',
  // アイコンとマニフェストは以下のmetadata形式で定義
  icons: {
    icon: [
      { url: '/pwa/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/pwa/apple-touch-icon.png' },
      { url: '/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/pwa/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/pwa/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
    ],
    shortcut: [{ url: '/pwa/favicon.ico' }],
  },
  // マニフェスト参照
  manifest: '/qrcode-manifest.json?v=9',
  // その他のメタデータ
  applicationName: 'My QR',
  appleWebApp: {
    capable: true,
    title: 'My QR',
    statusBarStyle: 'black-translucent',
  },
  themeColor: '#ffffff',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
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
      {/* PWA制御用スクリプト - ファイル名を qr-sw.js に修正 */}
      <Script id="pwa-control-script" strategy="beforeInteractive">
        {`
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/qr-sw.js')
              .then(function(registration) {
                console.log('QR ServiceWorker registration successful');
                
                // スタンドアロンモードで実行されているか確認
                if (window.matchMedia('(display-mode: standalone)').matches || 
                    navigator.standalone === true) {
                  // PWAモードで実行中
                  console.log('Running as PWA');
                  
                  // 現在のURLパスが/qrではない場合は/qrにリダイレクト
                  if (window.location.pathname !== '/qr') {
                    window.location.href = '/qr';
                  }
                }
              })
              .catch(function(err) {
                console.log('QR ServiceWorker registration failed', err);
              });
          });
        }
      `}
      </Script>

      {children}
    </>
  );
}