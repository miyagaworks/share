// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコード | Share',
  description: 'スタイリッシュなQRコードを作成',
  // titleとdescriptionを短くしてアイコン表示を優先
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
      <head>
        {/* PWAメタタグ */}
        <meta name="application-name" content="My QR" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />

        {/* iOSアイコン指定 - すべてのサイズを徹底的に指定 */}
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/pwa/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/pwa/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon-precomposed" href="/pwa/apple-touch-icon.png" />

        {/* 旧式ブラウザ用のfaviconも指定 */}
        <link rel="icon" type="image/png" href="/pwa/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/pwa/favicon-16x16.png" sizes="16x16" />
        <link rel="shortcut icon" href="/pwa/favicon.ico" />

        {/* マニフェスト */}
        <link rel="manifest" href="/qrcode-manifest.json?v=7" />
      </head>

      {/* PWA制御用スクリプト */}
      <Script id="pwa-control-script" strategy="beforeInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js') // qr-sw.js から sw.js に修正
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
