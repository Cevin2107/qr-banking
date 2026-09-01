// Service Worker cho CevinPay PWA - Tự động cập nhật tức thì
const CACHE_NAME = 'cevinpay-v7-' + Date.now();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Không cache API hoặc SSE
  if (url.pathname.startsWith('/api/') || url.hostname.includes('ntfy.sh')) {
    return;
  }

  // Network-First: Luôn ưu tiên lấy bản mới nhất từ Vercel server, nếu mất mạng mới dùng cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
