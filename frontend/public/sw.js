/* CareBridge AI service worker: offline shell + cached assets. Never caches API or translation calls. */
const V = 'cb-v5', SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png']
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => undefined)); self.skipWaiting() })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.pathname.startsWith('/api/') || u.hostname === 'translate.googleapis.com' || u.protocol === 'chrome-extension:') return
  if (r.mode === 'navigate') { // network first, fall back to the cached app shell when offline
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('/index.html', c)); return res }).catch(() => caches.match('/index.html')))
    return
  }
  const sameOrigin = u.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)
  if (!sameOrigin && !fonts) return
  e.respondWith(caches.match(r).then(hit => { // stale-while-revalidate
    const net = fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)) } return res }).catch(() => hit)
    return hit || net
  }))
})
