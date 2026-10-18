// Forja de Héroes · service worker: permite instalar la app y usarla sin conexión.
// Cambia VERSION en cada actualización para que los móviles descarguen la nueva.
const VERSION = 'forja-20261018-4';
const BASE = ['./', 'index.html', 'privacidad.html', 'manifest.webmanifest',
  'icons/icono-192.png', 'icons/icono-512.png', 'icons/icono-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // Supabase, Google y CDN van directos
  if (req.mode === 'navigate') {
    // Páginas: primero la red (para ver siempre la última versión); sin conexión, la copia guardada
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match(url.pathname.endsWith('privacidad.html') ? 'privacidad.html' : 'index.html')));
    return;
  }
  // Scripts, datos e iconos: la copia guardada al instante y se actualiza en segundo plano
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req);
    const red = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || red;
  }));
});
