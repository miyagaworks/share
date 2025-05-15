// app/qrcode/layout.tsx
export const metadata = {
  title: 'スタイリッシュQRコード | Share',
  description: 'スタイリッシュなQRコードを作成してスマホに保存できます',
};

export default function QrCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My QR Code" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
      </head>
      {children}
    </>
  );
}