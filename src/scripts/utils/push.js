// src/scripts/utils/push.js
console.log('[push] utils loaded (fixed proxy)');

// === BASE API (ubah ke domain Vercel kamu) ===
const API_BASE = 'https://acc-peta.vercel.app/api';
const VAPID_PUBLIC =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

const SUBSCRIBE_URL = `${API_BASE}/subscribe`;
const UNSUBSCRIBE_URL = `${API_BASE}/unsubscribe`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function tryPostJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  console.log('[push] SW registered?', !!reg, reg?.scope);
  return reg;
}

export async function ensurePermission() {
  if (!('Notification' in window)) throw new Error('Browser tidak mendukung Notification');
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Izin notifikasi ditolak');
}

async function getOrCreateSubscription(reg) {
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });
}

async function sendSubscription(sub, action = 'subscribe') {
  const url = action === 'unsubscribe' ? UNSUBSCRIBE_URL : SUBSCRIBE_URL;
  const body = action === 'unsubscribe' ? { endpoint: sub.endpoint } : sub.toJSON();
  const r = await tryPostJson(url, body);
  if (!r.ok) throw new Error(`Server responded ${r.status}`);
  console.log(`[push] ${action} success`, r.data);
  return r;
}

export async function setupPushToggle(btn) {
  if (!btn) return;
  if (btn._bound) return;
  btn._bound = true;

  const reg = await registerServiceWorker();
  if (!reg) {
    btn.disabled = true;
    btn.textContent = 'Push tidak didukung';
    return;
  }

  async function refreshLabel() {
    const sub = await reg.pushManager.getSubscription();
    btn.textContent = sub ? 'Matikan Notifikasi' : 'Nyalakan Notifikasi';
    btn.setAttribute('aria-pressed', String(!!sub));
  }

  btn.addEventListener('click', async () => {
    try {
      await ensurePermission();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sendSubscription(sub, 'unsubscribe');
        await sub.unsubscribe();
        alert('Notifikasi dimatikan');
      } else {
        const newSub = await getOrCreateSubscription(reg);
        await sendSubscription(newSub, 'subscribe');
        alert('Notifikasi diaktifkan');
      }
      await refreshLabel();
    } catch (e) {
      console.error('[push] toggle error:', e);
      alert(`Gagal toggle push: ${e.message}`);
    }
  });

  await refreshLabel();
}
