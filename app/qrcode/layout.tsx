// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'QRコード | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'My QR', // ホーム画面アイコン名
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My QR', // ここでもアイコン名を設定
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
      <head>
        <link rel="manifest" href="/qrcode-manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
      </head>

      {/* ユーザー固有のQRコードURLを記憶するスクリプト */}
      <Script id="pwa-user-qr-setup" strategy="beforeInteractive">
        {`
          (function() {
            // ホーム画面からの実行かチェック
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               navigator.standalone === true;
            
            if (isStandalone) {
              // 現在のURLが/qr/から始まるか確認
              const pathMatch = window.location.pathname.match(/\\/qr\\/([\\w-]+)/);
              const userQrPath = pathMatch ? '/qr/' + pathMatch[1] : null;
              
              // ユーザーのQRパスを記録
              if (userQrPath) {
                localStorage.setItem('userQrPath', userQrPath);
              }
              
              // 保存されたQRパスがあれば、そこに遷移
              const savedPath = localStorage.getItem('userQrPath');
              if (savedPath && window.location.pathname !== savedPath) {
                window.location.href = savedPath;
              }
            }
          })();
        `}
      </Script>

      {children}
    </>
  );
}