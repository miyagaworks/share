// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { AuthDebugger } from '@/components/shared/AuthDebugger';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// メタデータ定義
export const metadata: Metadata = {
  title: 'Share',
  description: 'デジタル名刺サービス',
  icons: {
    icon: '/pwa/favicon.ico', // 正しいパスを指定
    shortcut: '/pwa/favicon.ico',
    apple: '/pwa/apple-touch-icon.png',
  },
};

// ビューポート設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
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
          {process.env.NODE_ENV === 'development' && <AuthDebugger />}
        </SessionProvider>
      </body>
    </html>
  );
}