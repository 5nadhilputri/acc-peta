self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    try { data = JSON.parse(event.data.text()); } catch(_){ data = {}; }
  }

  const title = data.title || 'Story Update';
  const body = data.body || 'Ada pembaruan cerita.';
  const icon = data.icon || '/icon-192.png';
  const badge = data.badge || '/icon-192.png';
  const tag = data.tag || 'story-update';
  const url = data.url || '/';

  const actions = [{ action: 'open', title: 'Lihat Detail' }];

  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge, tag, actions, data: { url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      await client.focus();
      client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
      return;
    }
    return clients.openWindow(urlToOpen);
  })());
});
