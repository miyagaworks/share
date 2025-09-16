// public/sw.js
const CACHE_NAME = 'qrcode-pwa-v4'; // バージョンを上げる
const APP_SHELL = [
  '/qr', // /qrcode から /qr に変更
  '/qrcode', // 両方キャッシュしておく
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

  // vCard APIのキャッシュ処理
  if (requestUrl.pathname.includes('/api/vcard/')) {
    event.respondWith(
      caches.open('vcard-cache-v1').then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // 成功レスポンスのみ短時間キャッシュ
            if (response.status === 200) {
              const responseToCache = response.clone();
              cache.put(event.request, responseToCache);
              // 5分後に自動削除
              setTimeout(
                () => {
                  cache.delete(event.request);
                },
                5 * 60 * 1000,
              );
            }
            return response;
          })
          .catch(() => {
            // オフライン時はキャッシュから返す
            return cache.match(event.request);
          });
      }),
    );
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
            return caches.match('/qr'); // /qrcode から /qr に変更
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

// クライアントからのメッセージを受け取る
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'USER_QR_PATH_RESPONSE') {
    // ユーザー固有のQRコードパスを受け取った場合
    const userQrPath = event.data.path;
    if (userQrPath) {
      // クライアントをユーザー固有のパスにリダイレクト
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.navigate(userQrPath);
        });
      });
    }
  } else if (event.data && event.data.type === 'NAVIGATE') {
    // 特定のパスへのナビゲーション要求
    const path = event.data.url || '/qr'; // デフォルトパスを /qr に変更
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: 'window',
      })
      .then((clients) => {
        if (clients && clients.length) {
          clients[0].navigate(path);
          clients[0].focus();
        }
      });
  }
});