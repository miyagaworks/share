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
  // 環境に応じたセッションタイムアウト設定
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html lang="ja">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <SessionProvider
          // セッションタイムアウト時間（分単位）
          sessionTimeoutMinutes={isDevelopment ? 30 : 480} // 開発: 30分, 本番: 8時間
          // 警告表示時間（ログアウト何分前に警告するか）
          warningBeforeMinutes={isDevelopment ? 2 : 5} // 開発: 2分前, 本番: 5分前
          // 自動ログアウト機能を有効にする
          enableAutoLogout={true}
        >
          <ToastProvider />
          {children}
          {isDevelopment && <AuthDebugger />}
        </SessionProvider>
      </body>
    </html>
  );
}