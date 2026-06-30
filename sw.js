// Schrittfolge-Tool – Service Worker
// Bei jedem Update der App: Versionsnummer hochzählen (v1 -> v2 -> ...),
// damit alle Geräte automatisch die neue Version laden.
const CACHE = 'schrittfolge-v1';

const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Beim Installieren: Dateien in den Cache laden
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Beim Aktivieren: alte Caches (frühere Versionen) löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Bei jeder Anfrage: zuerst aus dem Cache bedienen, sonst aus dem Netz laden
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
