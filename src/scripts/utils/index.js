import { bindPushToggle, registerServiceWorker } from './utils/push.js';
import { addStory, getAllStories, deleteStory } from './utils/idb.js';

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function setupPushToggle() {
  await registerServiceWorker();

  const btn = document.getElementById('pushToggle');
  if (!btn) return;

  bindPushToggle(btn, (subscribed) => {
    console.log('[push] toggled ->', subscribed);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[index] DOM ready');
  setupPushToggle().catch(console.error);
});

(async function devIDBSmokeTest() {
  console.log('[idb] smoke test start');
  try {
    const id = Date.now();
    await addStory({ id, title: 'Smoke Test', description: 'Cek IndexedDB' });

    const stories1 = await getAllStories();
    console.log('Data di IndexedDB (awal):', stories1);

    await deleteStory(id);
    const stories2 = await getAllStories();
    console.log('Setelah hapus (smoke):', stories2);
  } catch (err) {
    console.error('[idb] smoke test error:', err);
  }
})();
