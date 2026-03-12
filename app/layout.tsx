// app/layout.tsx (reCAPTCHA v3対応版 + パートナーブランド動的化)
import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { getBrandConfig } from '@/lib/brand/config';
import { resolveBrandByHostname, resolveBrandByPartnerId } from '@/lib/brand/resolve';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/brand/defaults';
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

// パートナーブランドを解決するヘルパー
// x-partner-id ヘッダーがあればそれを優先、なければ host ベースで解決
async function resolvePartnerBrand() {
  const defaultBrand = getBrandConfig();
  try {
    const headersList = await headers();

    // Phase 7: middleware がセットした x-partner-id を優先的に使用
    const partnerId = headersList.get('x-partner-id');
    if (partnerId) {
      const resolved = await resolveBrandByPartnerId(partnerId);
      if (resolved.isPartner) {
        return { brand: { ...defaultBrand, ...resolved }, isPartner: true };
      }
    }

    // フォールバック: host ベースで解決
    const host = headersList.get('host');
    if (!host) return { brand: defaultBrand, isPartner: false };

    const resolved = await resolveBrandByHostname(host);
    if (resolved.isPartner) {
      return { brand: { ...defaultBrand, ...resolved }, isPartner: true };
    }
  } catch {
    // フォールバック: デフォルトブランド
  }
  return { brand: defaultBrand, isPartner: false };
}

// 動的メタデータ生成
export async function generateMetadata(): Promise<Metadata> {
  const { brand, isPartner } = await resolvePartnerBrand();
  return {
    title: isPartner ? brand.name : getBrandConfig().name,
    description: 'デジタル名刺サービス',
    manifest: '/api/manifest',
    icons: {
      icon: (isPartner && brand.faviconUrl) ? brand.faviconUrl : getBrandConfig().faviconUrl,
      shortcut: (isPartner && brand.faviconUrl) ? brand.faviconUrl : getBrandConfig().faviconUrl,
      apple: '/pwa/apple-touch-icon.png',
    },
  };
}

// 動的Viewport生成
export async function generateViewport(): Promise<Viewport> {
  const { brand, isPartner } = await resolvePartnerBrand();
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: isPartner ? brand.primaryColor : getBrandConfig().primaryColor,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { brand, isPartner } = await resolvePartnerBrand();
  const brandName = isPartner ? brand.name : getBrandConfig().name;
  const brandPrimaryColor = isPartner ? brand.primaryColor : getBrandConfig().primaryColor;

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        {/* 🚀 強化されたピンチアウト拡大防止設定 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content={brandName} />
        {/* 🚀 iOS Safari専用のピンチ防止 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* ブランドカラーがデフォルトと異なる場合、CSS変数を上書き */}
        {brandPrimaryColor !== DEFAULT_PRIMARY_COLOR && (
          <style dangerouslySetInnerHTML={{ __html: `:root { --individual-primary: ${brandPrimaryColor}; --ring: ${brandPrimaryColor}; }` }} />
        )}

        {/* reCAPTCHA削除済み - PAT問題回避のため */}

        {/* 🚀 JavaScript による拡大防止（passive最適化版） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let lastTouchEnd = 0;

                // ダブルタップ拡大防止のみpassive: false
                document.addEventListener('touchend', function (event) {
                  const now = Date.now();
                  if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                  }
                  lastTouchEnd = now;
                }, { passive: false });

                // iOS Safari ジェスチャー防止のみpassive: false
                if ('ongesturestart' in window) {
                  document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
                  document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });
                  document.addEventListener('gestureend', function(e) { e.preventDefault(); }, { passive: false });
                }

                // キーボード拡大防止
                document.addEventListener('keydown', function(event) {
                  if ((event.ctrlKey || event.metaKey) && ['+', '-', '0'].includes(event.key)) {
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
