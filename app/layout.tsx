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
<<<<<<< HEAD
  title: 'Share - 先進的なデジタル名刺でビジネスに差をつける | QRコードで瞬時に共有',
  description:
    '【無料トライアル実施中】経営者・ビジネスパーソン向けデジタル名刺サービス。複数SNSを一つに集約、QRコード一つでスマートに共有。先進的なビジネスツールで周囲と差をつけ、第一印象を変革します。 ',
  metadataBase: new URL('https://app.sns-share.com'),
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://app.sns-share.com',
    title: 'Share - 複数SNSを一つのデジタル名刺に | ビジネスの第一印象を変える',
    description:
      '経営者・ビジネスパーソン向けデジタル名刺サービス。複数SNSを一つに集約、QRコードで瞬時に共有。先進的なツールで差をつけ、ビジネスチャンスを広げます。',
    siteName: 'Share',
    images: [
      {
        url: 'https://app.sns-share.com/images/icons/ogp.png',
        width: 1200,
        height: 630,
        alt: 'Share - 先進的なデジタル名刺サービス',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share - 複数SNSを一つのデジタル名刺に | QRコードで瞬時に共有',
    description:
      '経営者・ビジネスパーソン向けデジタル名刺。SNSを一元管理、ビジネスに差をつける先進的ツール。7日間無料トライアル実施中。',
    images: ['https://app.sns-share.com/images/icons/ogp.png'],
  },
  other: {
    'line:image': 'https://app.sns-share.com/images/icons/ogp_line.png',
    'line:title': 'Share - デジタル名刺サービス',
    'line:description': '複数SNSを一つに集約、QRコードで瞬時に共有',
=======
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
>>>>>>> a20d17fb3f2293468ead8460ba8a1d377c3cb583
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