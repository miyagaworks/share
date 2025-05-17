// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'QRコードデザイナー | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
  applicationName: 'My QR Code',
  manifest: '/qrcode-manifest.json', // QRコード専用のマニフェストを追加
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My QR Code',
    startupImage: [
      {
        url: '/pwa/apple-splash-2048-2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      // 他の解像度も同様に追加できます
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
  return <>{children}</>;
}