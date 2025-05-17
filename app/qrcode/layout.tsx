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
        {/* PWA設定のメタタグ */}
        <meta name="application-name" content="My QR" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        {/* クエリパラメータでキャッシュバスティング */}
        <link rel="manifest" href="/qrcode-manifest.json?v=5" />
        {/* iOSに明示的にアイコン名を指定 */}
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <meta name="apple-mobile-web-app" content="yes" />

        {/* 明示的なアイコン表示設定 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* アイコン指定を強化 */}
        <link rel="apple-touch-icon-precomposed" href="/pwa/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/pwa/android-chrome-192x192.png" sizes="192x192" />
      </head>

      {/* PWA制御用スクリプト */}
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
