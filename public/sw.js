const CACHE_NAME = 'astro-health-shell-v1'
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/astrohealth-icon.svg']

function cacheResponse(request, response) {
  if (!response.ok) {
    return Promise.resolve()
  }

  return caches.open(CACHE_NAME).then((cache) =>
    cache.put(request, response.clone()).catch((error) => {
      console.error('Unable to cache an AstroHealth resource.', error)
    }),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('astro-health-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const requestUrl = new URL(request.url)

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return cacheResponse('/', response).then(() => response)
        })
        .catch(async () => {
          const cachedPage = await caches.match('/')
          if (cachedPage) {
            return cachedPage
          }
          throw new Error('No cached AstroHealth page is available offline.')
        }),
    )
    return
  }

  if (!/\.(?:js|css|svg|png|jpe?g|webp|woff2?)$/i.test(requestUrl.pathname)) {
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cachedResponse) =>
        cachedResponse ||
        fetch(request).then((response) => {
          return cacheResponse(request, response).then(() => response)
        }),
    ),
  )
})
