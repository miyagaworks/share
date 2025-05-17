// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコード | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
  // 明示的にマニフェストを指定
  manifest: '/qrcode-manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'My QR',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My QR',
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
      <head>
        {/* HTML headにも直接メタタグとマニフェストリンクを追加 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        {/* クエリパラメータでキャッシュバスティング */}
        <link rel="manifest" href="/qrcode-manifest.json?v=4" />
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