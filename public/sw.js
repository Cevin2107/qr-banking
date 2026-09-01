// Service Worker cho CevinPay PWA - Tự động cập nhật & Thông báo đẩy
const CACHE_NAME = 'cevinpay-v8-' + Date.now();

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

// Chạm vào thông báo đẩy hệ thống -> Mở hoặc Focus vào PWA App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Kết nối Kênh Cloud SSE ngầm để hiển thị thông báo đẩy kể cả khi đã đóng tab hoặc khóa màn hình
let bgEventSource = null;

function initBackgroundPush() {
  if (bgEventSource) return;
  try {
    bgEventSource = new EventSource('https://ntfy.sh/cevinpay_sepay_webhook_tpbank_10002150181/sse');
    bgEventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && payload.message) {
          const tx = JSON.parse(payload.message);
          if (tx && tx.transferAmount) {
            const amountStr = String(tx.transferAmount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            const title = `+${amountStr} ₫ · Nhận tiền TPBank 🟢`;
            const sender = tx.content || tx.description || 'Khách hàng';

            self.registration.showNotification(title, {
              body: `Nội dung: ${sender}`,
              icon: '/image-192.png',
              badge: '/image-192.png',
              tag: `tpbank-tx-${tx.id || Date.now()}`,
              vibrate: [200, 100, 200, 100, 200],
              renotify: true,
              data: { url: '/' }
            });
          }
        }
      } catch (err) {}
    };
  } catch (e) {}
}

try {
  initBackgroundPush();
} catch (e) {}

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
