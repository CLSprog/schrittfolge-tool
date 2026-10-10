// Schrittfolge-Tool – Service Worker (F1-05.2)
// WICHTIG: CACHE_VERSION bei jedem Update der App hochzählen.
// Der Cache-Name enthält die Version, damit alte Caches automatisch verworfen werden.
const CACHE_VERSION = 'v53-F1-05-2';
const CACHE = 'schrittfolge-' + CACHE_VERSION;

const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

const INDEX_URL = new URL('./index.html', self.registration.scope).href;

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

// Anfragen: NUR GET-Anfragen an die eigene Seite werden bearbeitet.
// Alles andere (Microsoft-Login/Graph, GitHub-API, pCloud, POST/PUT, Teil-Downloads)
// wird gar nicht angefasst und läuft unverändert am Service Worker vorbei.
// Für die eigene Seite gilt: ZUERST das Netz (neue Versionen kommen sofort an),
// nur ohne Internet wird der Cache als Rückfall genutzt.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(handle(req));
});

async function handle(req){
  const isNav = req.mode === 'navigate';
  try{
    const res = await fetch(req);
    // Nur echte, vollständige Antworten zwischenspeichern (keine Fehlerseiten, keine Teilantworten)
    if(res && res.status === 200 && res.type === 'basic'){
      const copy = res.clone();
      // Seitenaufrufe immer unter index.html ablegen (auch mit ?code=... vom Login-Rücksprung)
      caches.open(CACHE).then(cache => cache.put(isNav ? INDEX_URL : req, copy)).catch(()=>{});
    }
    return res;
  }catch(err){
    const cache = await caches.open(CACHE);
    let hit = await cache.match(req, { ignoreSearch: true });
    if(!hit && isNav) hit = await cache.match(INDEX_URL);
    return hit || Response.error();
  }
}
