// public/sw.js
const CACHE_NAME = 'qrcode-pwa-v1';
const APP_SHELL = [
  '/qrcode',
  '/qrcode-manifest.json',
  '/pwa/apple-touch-icon.png',
  '/pwa/android-chrome-192x192.png',
  '/pwa/android-chrome-512x512.png',
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  self.skipWaiting(); // 即時アクティベート

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(APP_SHELL);
    }),
  );
});

// フェッチイベントをインターセプト
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // ホーム画面から開いた場合にQRコードページにリダイレクト
  if (
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname === '/' &&
    event.request.mode === 'navigate'
  ) {
    console.log('[Service Worker] Redirecting to QR code page');
    event.respondWith(Response.redirect('/qrcode', 302));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // ネットワークからのレスポンスをキャッシュに保存
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時は最低限のフォールバックを返す
          if (event.request.mode === 'navigate') {
            return caches.match('/qrcode');
          }
          return new Response('Network error');
        });
    }),
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');

  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }),
      );
    }),
  );

  // PWAとしてインストールされた時にフラグをセット
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PWA_INSTALLED',
          timestamp: new Date().toISOString(),
        });
      });
    }),
  );

  return self.clients.claim();
});

// プッシュイベントリスナー（今後の拡張用）
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  const title = 'Share QRコード';
  const options = {
    body: 'QRコードが更新されました',
    icon: '/pwa/android-chrome-192x192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ユーザーがPWAを開いているときにナビゲーションを制御
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NAVIGATE') {
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: 'window',
      })
      .then((clients) => {
        if (clients && clients.length) {
          clients[0].navigate('/qrcode');
          clients[0].focus();
        }
      });
  }
});