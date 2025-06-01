// app/layout.tsx (自動ログアウト無効化版)
import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Share',
  description: 'デジタル名刺サービス',
  icons: {
    icon: '/pwa/favicon.ico',
    shortcut: '/pwa/favicon.ico',
    apple: '/pwa/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html lang="ja">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <QueryProvider>
          <SessionProvider
            sessionTimeoutMinutes={isDevelopment ? 120 : 480} // 開発環境を2時間に延長
            warningBeforeMinutes={isDevelopment ? 10 : 5} // 警告も10分前に
            enableAutoLogout={!isDevelopment} // 🔥 開発環境では完全無効化
            excludePaths={[
              // 🚀 除外パスを追加
              '/dashboard/design',
              '/dashboard/links',
              '/dashboard/corporate-member',
            ]}
          >
            <ToastProvider />
            {children}
            {/* 🔧 AuthDebuggerは一時的に無効化 */}
            {/* {isDevelopment && <AuthDebugger />} */}
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}