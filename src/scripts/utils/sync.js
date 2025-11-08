import { openDB } from 'idb';

const DB_NAME = 'peta-cerita-db';
const DB_VERSION = 4; // harus sama dengan di idb.js
const STORE_OUTBOX = 'outbox';

/**
 * Dengarkan event 'online' untuk memicu sinkronisasi otomatis.
 */
export async function registerBackgroundSync() {
  window.addEventListener('online', async () => {
    console.log('[sync] Internet kembali online — mulai sinkronisasi...');
    await syncOutbox();
  });
}

/**
 * Kirim seluruh story yang tersimpan di OUTBOX ke API.
 * Hapus dari outbox jika berhasil dikirim.
 */
export async function syncOutbox() {
  const db = await openDB(DB_NAME, DB_VERSION);
  const outboxStories = await db.getAll(STORE_OUTBOX);

  if (!outboxStories.length) {
    console.log('[sync] Tidak ada story yang perlu disinkronkan.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('[sync] Tidak ada token — pengguna belum login.');
    return;
  }

  console.log(`[sync] Menemukan ${outboxStories.length} story untuk dikirim...`);

  for (const story of outboxStories) {
    try {
      const formData = new FormData();
      formData.append('description', story.description);
      if (story.photoBlob) {
        formData.append('photo', story.photoBlob, story.photoName || 'photo.jpg');
      }
      if (story.lat && story.lon) {
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);
      }

      const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        console.error(`[sync] Gagal mengirim story "${story.description}"`);
        continue;
      }

      console.log(`[sync] Story "${story.description}" berhasil disinkronkan.`);
      await db.delete(STORE_OUTBOX, story.id);
    } catch (err) {
      console.error('[sync] Error saat sinkronisasi:', err);
    }
  }

  console.log('[sync] Sinkronisasi selesai.');
}
