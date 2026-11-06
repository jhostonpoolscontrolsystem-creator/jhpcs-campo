// Service Worker para JHPCS PWA (App do Tratador / Piscineiro)
const CACHE_NAME = 'jhpcs-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/pwa',
  '/manifest.json',
  '/manifest-pwa.json',
  '/favicon.ico',
  '/globe.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estratégia Network First com fallback para Cache para permitir operação Offline de leitura
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Suporte a Background Sync para envios de formulário offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-maintenance-logs') {
    event.waitUntil(syncMaintenanceLogs());
  }
});

async function syncMaintenanceLogs() {
  console.log('Background Sync: Sincronizando laudos offline pendentes...');
  // Na versão final, aqui o IndexedDB é lido e os POSTs são disparados para /api/maintenance/submit
  return Promise.resolve();
}
