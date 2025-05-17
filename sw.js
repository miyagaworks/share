// public/sw.js
const CACHE_NAME = 'qrcode-pwa-v1';
const urlsToCache = [
  '/qrcode',
  '/qrcode-manifest.json',
  '/pwa/apple-touch-icon.png',
  '/pwa/android-chrome-192x192.png',
  '/pwa/android-chrome-512x512.png',
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }),
  );
});

// フェッチイベントをインターセプト
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュが見つかった場合はキャッシュから返す
      if (response) {
        return response;
      }

      // キャッシュにない場合はネットワークから取得
      return fetch(event.request).then((response) => {
        // 有効なレスポンスかチェック
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // レスポンスのクローンを作成（ストリームは一度しか読めないため）
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }),
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});