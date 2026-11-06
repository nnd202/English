// Service worker : réseau d'abord, cache en secours (fonctionne hors ligne).
// Tout nouveau fichier doit être ajouté à CORE (tools/check.mjs le vérifie).
const CACHE = 'english-v9';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/fsrs.js',
  'js/tirage.js',
  'js/ipa.js',
  'js/voix.js',
  'js/dictee.js',
  'js/temps.js',
  'js/decks.js',
  'js/paquet.js',
  'data/langue.json',
  'data/lots.json',
  'data/temps.json',
  'data/decks.json',
  'data/paquets.json',
  'data/lots/lot-001.json',
  'data/lots/lot-002.json',
  'data/lots/lot-003.json',
  'data/lots/lot-004.json',
  'data/lots/lot-005.json',
  'data/lots/lot-006.json',
  'data/lots/lot-007.json',
  'data/lots/lot-008.json',
  'data/dictees/dictees-001.json',
  'data/dictees/banque-001.json',
  'icons/icon-64.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
