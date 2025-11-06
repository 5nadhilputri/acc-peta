// src/scripts/index.js
import { bindPushToggle, registerServiceWorker } from './utils/push.js';

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

/**
 * Wrapper lokal agar kompatibel dengan pemanggilan lama.
 * TIDAK mengimpor setupPushToggle dari ./utils/push (memang tidak ada di sana).
 */
export async function setupPushToggle() {
  await registerServiceWorker();
} 

  const btn = document.getElementById('pushToggle'); // pastikan id ini ada di HTML
