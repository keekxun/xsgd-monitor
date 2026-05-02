const CACHE = 'xsgd-monitor-v2';
const SHELL = ['./xsgd-monitor.html', './manifest.json', './arb-bot.html', './manifest-arb.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Let API calls go through — always want live data
  const url = e.request.url;
  if (url.includes('coingecko.com') || url.includes('oanda.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
