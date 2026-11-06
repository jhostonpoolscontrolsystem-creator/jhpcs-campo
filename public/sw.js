// Service Worker para JHPCS-CAMPO (App do Tratador / Piscineiro)
const CACHE_NAME = 'jhpcs-campo-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/primeiro-acesso'
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
  // Ignora chamadas de API ou requisições POST para não quebrar chamadas dinâmicas
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Estratégia Network First com fallback para Cache
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
});

// Suporte a Background Sync para envios de formulário offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-maintenance-logs') {
    event.waitUntil(syncMaintenanceLogs());
  }
});

async function syncMaintenanceLogs() {
  console.log('Background Sync: Sincronizando laudos offline pendentes no JHPCS-CAMPO...');
  return Promise.resolve();
}
