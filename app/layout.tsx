// app/layout.tsx (reCAPTCHA v3対応版)
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

// 🚀 Viewport設定を分離
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        {/* 🚀 強化されたピンチアウト拡大防止設定 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Share" />
        <meta name="theme-color" content="#3B82F6" />
        {/* 🚀 iOS Safari専用のピンチ防止 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* 🔒 reCAPTCHA v3スクリプト */}
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          async
          defer
        />

        {/* 🚀 JavaScript による拡大防止 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // ピンチアウト拡大を防ぐ
                let lastTouchEnd = 0;
                let isZooming = false;
                
                // ダブルタップ拡大防止
                document.addEventListener('touchend', function (event) {
                  const now = (new Date()).getTime();
                  if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                  }
                  lastTouchEnd = now;
                }, { passive: false });
                
                // ピンチジェスチャー検出と防止
                document.addEventListener('touchstart', function(event) {
                  if (event.touches.length > 1) {
                    event.preventDefault();
                  }
                }, { passive: false });
                
                document.addEventListener('touchmove', function(event) {
                  if (event.touches.length > 1) {
                    event.preventDefault();
                  }
                }, { passive: false });
                
                // ピンチ拡大の検出
                document.addEventListener('gesturestart', function(event) {
                  event.preventDefault();
                  isZooming = true;
                }, { passive: false });
                
                document.addEventListener('gesturechange', function(event) {
                  event.preventDefault();
                }, { passive: false });
                
                document.addEventListener('gestureend', function(event) {
                  event.preventDefault();
                  isZooming = false;
                }, { passive: false });
                
                // キーボードショートカットでの拡大も防止
                document.addEventListener('keydown', function(event) {
                  if ((event.ctrlKey || event.metaKey) && 
                      (event.key === '+' || event.key === '-' || event.key === '0')) {
                    event.preventDefault();
                  }
                }, { passive: false });
                
                // ホイール拡大防止
                document.addEventListener('wheel', function(event) {
                  if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                  }
                }, { passive: false });
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}>
        <QueryProvider>
          <SessionProvider>
            <ToastProvider />
            {children}
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}