import { openDB } from 'idb';

const DB_NAME = 'peta-cerita-db';
const DB_VERSION = 4; // pastikan lebih besar dari sebelumnya
const STORE_NAME = 'stories';
const STORE_OUTBOX = 'outbox';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!database.objectStoreNames.contains(STORE_OUTBOX)) {
      database.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
    }
  },
});

// === CRUD untuk story utama (peta / daftar) ===
export const addStory = async (story) => (await dbPromise).put(STORE_NAME, story);
export const getAllStories = async () => (await dbPromise).getAll(STORE_NAME);
export const deleteStory = async (id) => (await dbPromise).delete(STORE_NAME, id);

// === Queue offline untuk sync ===
export const queueStory = async (story) => (await dbPromise).put(STORE_OUTBOX, story);
export const getOutboxStories = async () => (await dbPromise).getAll(STORE_OUTBOX);
export const deleteOutboxStory = async (id) => (await dbPromise).delete(STORE_OUTBOX, id);
