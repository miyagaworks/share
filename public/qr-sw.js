// public/qr-sw.js
const CACHE_NAME = 'qr-pwa-v1';
const ASSETS = ['/qr', '/qr-sw.js', '/qrcode-manifest.json', '/pwa/apple-touch-icon.png'];

// インストール
self.addEventListener('install', (event) => {
  console.log('[QR ServiceWorker] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[QR ServiceWorker] Caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        // 即時アクティベート
        return self.skipWaiting();
      }),
  );
});

// フェッチ
self.addEventListener('fetch', (event) => {
  // QRコードページのPWA化に特化したフェッチハンドラ
  const requestUrl = new URL(event.request.url);

  // スタンドアロンモードでのナビゲーション処理
  if (event.request.mode === 'navigate') {
    // PWAとして起動時、ルートURLをQRコードページにリダイレクト
    if (requestUrl.pathname === '/') {
      console.log('[QR ServiceWorker] Redirecting to QR code page');
      event.respondWith(Response.redirect('/qrcode', 302));
      return;
    }
  }

  // 通常のリクエスト処理
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // キャッシュがあればそれを返す
      if (cachedResponse) {
        return cachedResponse;
      }

      // キャッシュにない場合はネットワークからフェッチ
      return fetch(event.request)
        .then((response) => {
          // レスポンスのクローンを作成（ストリームは一度しか読めないため）
          const responseToCache = response.clone();

          // 成功したレスポンスのみキャッシュ
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // オフラインの場合、QRコードページをフォールバックとして提供
          if (event.request.mode === 'navigate') {
            return caches.match('/qrcode');
          }

          // その他のリクエストではエラーレスポンスを返す
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    }),
  );
});

// アクティベート
self.addEventListener('activate', (event) => {
  console.log('[QR ServiceWorker] Activating...');

  // 古いキャッシュの削除
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[QR ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // アクティブ化完了
        console.log('[QR ServiceWorker] Activated');
        return self.clients.claim();
      }),
  );
});