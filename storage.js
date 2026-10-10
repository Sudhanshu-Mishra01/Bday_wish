/**
 * ==============================================================================
 * 📦 BDAY SURPRISE — INDEXEDDB & STORAGE SYNC
 * Stores high-res photos, video files, and custom text with zero size limits.
 * ==============================================================================
 */

window.BdayStorage = (function () {
  'use strict';

  const DB_NAME = 'RomanticBdaySurpriseDB';
  const DB_VERSION = 1;
  const STORE_MEDIA = 'media';
  const STORE_SETTINGS = 'settings';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });

    return dbPromise;
  }

  // Save a media item (Blob, DataURL, or Object URL)
  async function saveMedia(id, data, metadata = {}) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.put({ id, data, metadata, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // Retrieve a media item
  async function getMedia(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const store = tx.objectStore(STORE_MEDIA);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // Delete media item
  async function deleteMedia(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // Save settings object
  async function saveSettings(settings) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ id: 'current_config', data: settings, updatedAt: Date.now() });
      tx.oncomplete = () => {
        // Also sync basic text to localStorage for instant synchronous boot
        try {
          localStorage.setItem('romantic_bday_custom_config', JSON.stringify(settings));
        } catch (e) {
          console.warn('localStorage quota exceeded, IndexedDB retained.', e);
        }
        resolve(true);
      };
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // Retrieve settings
  async function getSettings() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('current_config');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve(req.result.data);
          } else {
            // Fallback to localStorage
            const local = localStorage.getItem('romantic_bday_custom_config');
            resolve(local ? JSON.parse(local) : null);
          }
        };
        req.onerror = () => {
          const local = localStorage.getItem('romantic_bday_custom_config');
          resolve(local ? JSON.parse(local) : null);
        };
      });
    } catch (e) {
      const local = localStorage.getItem('romantic_bday_custom_config');
      return local ? JSON.parse(local) : null;
    }
  }

  // Clear all custom data
  async function clearAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MEDIA, STORE_SETTINGS], 'readwrite');
      tx.objectStore(STORE_MEDIA).clear();
      tx.objectStore(STORE_SETTINGS).clear();
      tx.oncomplete = () => {
        localStorage.removeItem('romantic_bday_custom_config');
        resolve(true);
      };
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  return {
    saveMedia,
    getMedia,
    deleteMedia,
    saveSettings,
    getSettings,
    clearAll
  };
})();
