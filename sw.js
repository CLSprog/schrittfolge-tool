// Schrittfolge-Tool – Service Worker
// WICHTIG: CACHE_VERSION bei jedem Update der App hochzählen (v2 -> v3 -> ...).
// Der Cache-Name enthält die Version, damit alte Caches automatisch verworfen werden.
const CACHE_VERSION = 'v35-F1-04-1';
const CACHE = 'schrittfolge-' + CACHE_VERSION;

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

// Bei jeder Anfrage: ZUERST versuchen aktuelle Version aus dem Netz zu laden.
// Nur wenn kein Internet verfügbar ist, wird auf den Cache zurückgefallen.
// Das stellt sicher, dass neue App-Versionen sofort erkannt werden,
// während die App offline trotzdem funktioniert (Cache als Fallback).
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Erfolgreiche Netzwerk-Antwort: Cache aktualisieren und zurückgeben
        const responseClone = networkResponse.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, responseClone));
        return networkResponse;
      })
      .catch(() => {
        // Kein Internet: aus dem Cache bedienen (Offline-Fallback)
        return caches.match(e.request);
      })
  );
});
