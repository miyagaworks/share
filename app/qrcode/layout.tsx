// app/qrcode/layout.tsx
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'スタイリッシュQRコード | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
  applicationName: 'My QR Code',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My QR Code',
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