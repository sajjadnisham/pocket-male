/* Pocket Malé service worker — makes the installed app open offline.
   Pages, data and scripts: network first, falling back to the cache, so updates arrive as soon as you're online.
   Fonts and three.js: cache first. Audio is left to the browser: iOS Safari won't play <audio> from a
   service-worker response without byte-range support. ChatGPT calls (POST) are never cached. */
const VERSION = 'pm-v2';
const SHELL = [
  './', './index.html', './city.html', './about.html', './data.js', './config.js', './manifest.json', './icon.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './audio/manifest.json', './city-data.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || /\.mp3$/i.test(url.pathname)) return;
  const sameOrigin = url.origin === self.location.origin;
  const cacheFirst = /fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname);
  if (!sameOrigin && !cacheFirst) return;
  if (cacheFirst){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
