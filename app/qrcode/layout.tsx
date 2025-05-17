// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコード | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
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
        {/* PWA設定のメタタグを直接追加 */}
        <meta name="application-name" content="My QR" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="theme-color" content="#ffffff" />

        {/* Apple Touch アイコン */}
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/pwa/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/apple-touch-icon-180x180.png" />

        {/* マニフェストファイル（バージョンパラメータ付き） */}
        <link rel="manifest" href="/qrcode-manifest.json?v=3" />
      </head>

      {/* PWA用のスクリプト */}
      <Script id="pwa-setup" strategy="beforeInteractive">
        {`
          // PWA検出と起動時処理
          if (window.matchMedia('(display-mode: standalone)').matches || 
              (window.navigator.standalone === true)) {
            // PWAとして実行中
            console.log('Running as PWA');
            
            // クエリパラメータをローカルストレージに保存
            const urlParams = new URLSearchParams(window.location.search);
            const qrCode = urlParams.get('qr');
            if (qrCode) {
              localStorage.setItem('userQrCode', qrCode);
            }
            
            // ユーザーのQRコードがある場合は、そのURLに遷移
            const savedQr = localStorage.getItem('userQrCode');
            if (savedQr && window.location.pathname === '/') {
              window.location.href = '/qr/' + savedQr;
            }
          }
        `}
      </Script>

      {children}
    </>
  );
}