/* ELITE Academy — service worker (app instalável)
   - Páginas e arquivos do site: tenta a internet primeiro (sempre a versão nova);
     sem internet, usa a cópia guardada.
   - /api (login, progresso, conteúdo): nunca guarda em cache. */
const VERSION = 'elite-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/admin.js', '/manifest.webmanifest',
  '/assets/elite-academy-cover.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'elite-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === location.origin){
    if(url.pathname.startsWith('/api/')) return;                 // dados sempre ao vivo
    e.respondWith(networkFirst(req, req.mode === 'navigate'));
    return;
  }
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(caches.open('elite-fonts').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if(r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
async function networkFirst(req, isPage){
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if(res.ok) cache.put(isPage ? '/index.html' : req, res.clone());
    return res;
  } catch(err){
    return (await cache.match(isPage ? '/index.html' : req, {ignoreSearch: true})) || (isPage ? cache.match('/', {ignoreSearch: true}) : Response.error());
  }
}
