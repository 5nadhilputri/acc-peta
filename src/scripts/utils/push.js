// src/scripts/utils/push.js
// Push Notification utilities (client) — via Vercel proxy → Dicoding API
console.log('[push] utils loaded (proxy → Dicoding)');

const API_BASE = 'https://acc-peta.vercel.app/api'; // domain Vercel kamu
const VAPID_PUBLIC =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

// Endpoint proxy (biar jelas di Network log saat direview)
const SUBSCRIBE_ENDPOINT_CANDIDATES   = [`${API_BASE}/subscribe`];
const UNSUBSCRIBE_ENDPOINT_CANDIDATES = [`${API_BASE}/unsubscribe`];

/* =========================
   Helpers
========================= */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function tryPostJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text(); // supaya error body tetap kebaca
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function postToFirstWorking(candidates, body) {
  let last;
  for (const url of candidates) {
    const r = await tryPostJson(url, body);
    last = r;
    if (r.ok) return r.data;
    console.warn('[push] proxy call failed', url, r.status, r.data);
  }
  throw new Error(`Proxy call failed (last status ${last?.status})`);
}

/* =========================
   Service Worker
========================= */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[push] Service Worker not supported');
    return null;
  }
  const reg = await navigator.serviceWorker.register('/sw.js');
  console.log('[push] SW registered?', !!reg, reg && reg.scope);
  return reg;
}

/* =========================
   Capability & Status
========================= */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getStatus() {
  if (!isPushSupported()) {
    return { supported: false, permission: 'denied', subscribed: false, endpoint: null };
  }
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!sub,
    endpoint: sub?.endpoint || null,
  };
}

export async function requestPermission() {
  if (!isPushSupported()) throw new Error('Push not supported in this browser');
  if (Notification.permission === 'granted') return 'granted';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission denied');
  return perm;
}

/* =========================
   Subscribe / Unsubscribe
========================= */
export async function subscribePush(extraMeta = {}) {
  // pastikan SW terdaftar
  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
  if (!reg) throw new Error('Service worker not available');

  // pastikan izin
  if (Notification.permission !== 'granted') await requestPermission();

  // subscribe ke PushManager
  const existing = await reg.pushManager.getSubscription();
  const subscription = existing || (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  }));

  // kirim ke proxy vercel (yang akan forward ke Dicoding)
  await postToFirstWorking(SUBSCRIBE_ENDPOINT_CANDIDATES, {
    subscription, // berisi endpoint, keys.p256dh, keys.auth
    meta: {
      app: 'acc-peta',
      subscribedAt: new Date().toISOString(),
      ...extraMeta,
    },
  });

  console.log('[push] subscribed & sent to proxy');
  return subscription;
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (!sub) return false;

  // kabari proxy dulu, lalu local-unsubscribe
  try {
    await postToFirstWorking(UNSUBSCRIBE_ENDPOINT_CANDIDATES, { endpoint: sub.endpoint });
  } catch (e) {
    console.warn('[push] proxy unsubscribe failed; continue local:', e.message);
  }

  const ok = await sub.unsubscribe();
  console.log('[push] unsubscribed?', ok);
  return ok;
}

export async function togglePush() {
  const { subscribed } = await getStatus();
  if (subscribed) {
    await unsubscribePush();
    return { subscribed: false };
  } else {
    await subscribePush();
    return { subscribed: true };
  }
}

/* =========================
   UI Helper (opsional)
========================= */
export function bindPushToggle(buttonEl, onChange = () => {}) {
  if (!buttonEl) return;
  (async () => {
    const { supported, subscribed } = await getStatus();
    if (!supported) {
      buttonEl.disabled = true;
      buttonEl.textContent = 'Push not supported';
      return;
    }
    buttonEl.textContent = subscribed ? 'Matikan Notifikasi' : 'Nyalakan Notifikasi';
  })();

  buttonEl.addEventListener('click', async () => {
    buttonEl.disabled = true;
    try {
      const { subscribed } = await togglePush();
      buttonEl.textContent = subscribed ? 'Matikan Notifikasi' : 'Nyalakan Notifikasi';
      onChange(subscribed);
    } catch (e) {
      alert(`Gagal toggle push: ${e.message}`);
    } finally {
      buttonEl.disabled = false;
    }
  });
}

/* =========================
   DevTools hooks (opsional)
========================= */
if (typeof window !== 'undefined') {
  window.__push = {
    status: getStatus,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    toggle: togglePush,
  };
}

export const setupPushToggle = bindPushToggle;