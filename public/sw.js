// Service Worker cho PWA
const CACHE_NAME = 'cevinpay-v6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Không bao giờ cache API requests hoặc SSE events
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  // Ưu tiên lấy từ Network để luôn cập nhật mã mới nhất
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
