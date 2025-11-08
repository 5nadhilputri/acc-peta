const CACHE_NAME = 'peta-cerita-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/ss/screenshoot-beranda.png',
  '/ss/screenshoot-about.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching app shell...');
      try {
        await cache.addAll(APP_SHELL);
        console.log('[SW] App shell cached successfully!');
      } catch (err) {
        console.warn('[SW] Some files failed to cache:', err);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((oldName) => {
            console.log('[SW] Removing old cache:', oldName);
            return caches.delete(oldName);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  if (req.url.includes('/api/') || req.url.includes('/stories')) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

async function networkFirst(req) {
  const cache = await caches.open('dynamic-cache-v1');
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || new Response('Offline: Data tidak tersedia', { status: 503 });
  }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    try {
      data = JSON.parse(event.data.text());
    } catch (_) {
      data = {};
    }
  }

  const title = data.title || 'Story Update';
  const body = data.body || 'Ada pembaruan cerita.';
  const icon = data.icon || '/icons/icon-192.png';
  const badge = data.badge || '/icons/icon-192.png';
  const tag = data.tag || 'story-update';
  const url = data.url || '/';

  const actions = [{ action: 'open', title: 'Lihat Detail' }];

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      actions,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    })()
  );
});

// sw.js (tambahkan di akhir file)
async function notifyClientsToSync() {
  const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of all) {
    client.postMessage({ type: 'SYNC_OUTBOX' });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    // Minta tab/halaman melakukan sync (karena SW tidak punya token auth)
    event.waitUntil(notifyClientsToSync());
  }
});
