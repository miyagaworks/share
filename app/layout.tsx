// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Share - SNSアカウントと連絡先を一つのプロフィールに',
  description:
    '複数のSNSアカウントと連絡先情報を一つのデジタルプロフィールにまとめ、QRコードやNFCを通じて簡単に共有できるプラットフォーム',
  keywords: ['デジタル名刺', 'SNS', 'プロフィール共有', 'QRコード', '連絡先'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/pwa/apple-touch-icon.png', sizes: '180x180' },
      { url: '/pwa/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/pwa/apple-touch-icon-167x167.png', sizes: '167x167' },
    ],
    other: [
      { url: '/pwa/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Share',
    statusBarStyle: 'default',
    capable: true,
  },
};

// ビューポート設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <SessionProvider>
          <ToastProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}