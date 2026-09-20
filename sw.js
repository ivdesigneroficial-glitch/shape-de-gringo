// SHAPE DE GRINGO 2.0 · service worker
// Estratégia: network-first pra HTML (sempre pega a versão nova),
// cache-first pra assets estáticos (ícones, manifest).
const CACHE = 'sdg-v2-2026-09-20';
const STATIC = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Sempre network pra hosts externos (YouTube, Kiwify, Netlify)
  if (url.origin !== location.origin) return;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    // network-first
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // cache-first pra assets
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(net => {
        if (net.ok) { const copy = net.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return net;
      }))
    );
  }
});
