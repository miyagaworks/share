// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  },
};

// ビューポート設定
export const viewport: Viewport = {
  width: "device-width",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <ToastProvider />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}