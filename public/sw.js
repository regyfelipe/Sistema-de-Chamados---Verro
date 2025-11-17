// Service Worker para cache offline
const CACHE_NAME = 'sistema-chamados-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Assets estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/tickets',
  '/offline', // Página offline
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            )
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return
  }

  // Ignorar requisições para APIs externas (Supabase, etc)
  if (
    request.url.includes('supabase.co') ||
    request.url.includes('api/') ||
    request.url.includes('_next/')
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clonar resposta para cache
        const responseToCache = response.clone()

        // Cache dinâmico para páginas
        if (request.destination === 'document') {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        // Fallback para cache se offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Se for uma página, retornar página offline
          if (request.destination === 'document') {
            return caches.match('/offline')
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})

// Limpar cache antigo periodicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== CACHE_NAME
          ) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  }
})

