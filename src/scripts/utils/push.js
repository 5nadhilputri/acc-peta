// src/scripts/utils/push.js
console.log('[push] utils loaded (with Dicoding API integration)');

const API_BASE = 'https://story-api.dicoding.dev/v1';
const VAPID_PUBLIC =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/* =========================
   Service Worker register
========================= */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  console.log('[push] SW registered?', !!reg, reg && reg.scope);
  return reg;
}

/* =========================
   Helpers: API subscribe
========================= */

/**
 * Beberapa cohort Dicoding menggunakan path berbeda.
 * Kita coba beberapa endpoint agar kompatibel di semua variasi.
 */
const SUBSCRIBE_ENDPOINT_CANDIDATES = [
  `${API_BASE}/push-subscribe`,
  `${API_BASE}/push/subscribe`,
];
const UNSUBSCRIBE_ENDPOINT_CANDIDATES = [
  `${API_BASE}/push-unsubscribe`,
  `${API_BASE}/push/unsubscribe`,
];

async function postToAny(urls, payload, method = 'POST') {
  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await safeJson(res);
        console.log(`[push] API ${method} OK ->`, url, data);
        return data || {};
      } else {
        const txt = await res.text().catch(() => '');
        console.warn(`[push] API ${method} FAIL ${res.status} @ ${url}`, txt);
        lastErr = new Error(`HTTP ${res.status} @ ${url}`);
      }
    } catch (e) {
      console.warn(`[push] API ${method} error @ ${url}`, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All endpoints failed');
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

/** Kirim subscription ke server Dicoding */
async function syncSubscribeToServer(subscription) {
  return postToAny(SUBSCRIBE_ENDPOINT_CANDIDATES, subscription, 'POST');
}

/** Beri tahu server saat unsubscribe (jika endpoint tersedia) */
async function syncUnsubscribeToServer(subscription) {
  // Sebagian server minta payload subscription saat unsubscribe;
  // kalau 404/400, kita abaikan agar UX tetap lancar.
  try {
    await postToAny(UNSUBSCRIBE_ENDPOINT_CANDIDATES, subscription, 'POST');
  } catch (e) {
    console.warn('[push] server unsubscribe ignored:', e?.message || e);
  }
}

/* =========================
   Subscription helpers
========================= */

export async function getSubscription() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg?.pushManager.getSubscription();
}

/** Pastikan permission, subscribe ke PushManager, lalu sync ke API Dicoding */
export async function ensurePushPermissionAndSubscribe() {
  console.log('[push] ensurePushPermissionAndSubscribe — permission:', Notification.permission);

  if (!('PushManager' in window) || !('Notification' in window)) {
    alert('Push Notification tidak didukung di browser ini.');
    return null;
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    console.log('[push] permission result:', perm);
    if (perm !== 'granted') return null;
  }

  const reg = await navigator.serviceWorker.ready;

  // kalau sudah ada, langsung kembalikan (dan pastikan tersinkron ke server)
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    console.log('[push] already subscribed (client). Ensuring server sync…');
    try { await syncSubscribeToServer(existing); } catch (_) {}
    return existing;
  }

  // buat subscription baru
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });

  // simpan untuk debugging
  localStorage.setItem('push_subscription', JSON.stringify(sub));

  // sinkron ke API Dicoding (WAJIB untuk memenuhi kriteria)
  await syncSubscribeToServer(sub);

  console.log('[push] subscribed & synced to Dicoding ✅');
  return sub;
}

export async function unsubscribePush() {
  const sub = await getSubscription();
  if (!sub) {
    console.log('[push] no subscription to unsubscribe');
    return;
  }
  try {
    await syncUnsubscribeToServer(sub);
  } catch (_) {}
  await sub.unsubscribe();
  localStorage.removeItem('push_subscription');
  console.log('[push] unsubscribed (client) ✅');
}

/* =========================
   UI: Toggle Button
========================= */

/**
 * Pasang handler pada tombol toggle push.
 * Tombol diharapkan punya id="pushToggle".
 */
export async function setupPushToggle(buttonEl) {
  console.log('[push] setupPushToggle — button exists?', !!buttonEl);
  if (!buttonEl) return;

  // hindari dobel listener
  buttonEl._pushBound && buttonEl.removeEventListener('click', buttonEl._pushBound);

  const setState = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    const enabled = !!sub;

    if (Notification.permission === 'denied') {
      buttonEl.textContent = 'Izinkan Notifikasi di ikon 🔒';
      buttonEl.setAttribute('aria-pressed', 'false');
      return;
    }

    buttonEl.textContent = enabled ? 'Matikan Push' : 'Nyalakan Push';
    buttonEl.setAttribute('aria-pressed', String(enabled));
  };

  const onClick = async () => {
    console.log('[push] toggle clicked — permission:', Notification.permission);

    if (Notification.permission === 'denied') {
      alert('Notifikasi diblokir. Klik ikon kunci → Notifications → Allow, lalu reload.');
      return;
    }

    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();

    try {
      if (sub) {
        await unsubscribePush();
      } else {
        await ensurePushPermissionAndSubscribe();
      }
    } catch (err) {
      console.warn('[push] toggle error:', err);
      alert('Gagal mengubah status push. Coba reload lalu ulangi.');
    }

    await setState();
  };

  buttonEl._pushBound = onClick;
  buttonEl.addEventListener('click', onClick);

  // update awal
  await setState();

  // update otomatis jika permission berubah
  if (navigator.permissions?.query) {
    try {
      const p = await navigator.permissions.query({ name: 'notifications' });
      p.onchange = setState;
    } catch {}
  }
}

/* =========================
   SW → App navigation bridge
========================= */

navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'NAVIGATE') {
    const url = event.data.url || '/';
    if (url.includes('#/')) {
      location.hash = url.substring(url.indexOf('#'));
    } else {
      location.hash = '/';
    }
  }
});

/* =========================
   Debug hooks (optional)
========================= */
window._pushHook = {
  registerServiceWorker,
  setupPushToggle,
  ensurePushPermissionAndSubscribe,
  unsubscribePush,
};
