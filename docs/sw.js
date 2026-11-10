// 會議管考流程平台 - Service Worker
// 提供 PWA 安裝支援 + 基本快取
const CACHE_NAME = 'meeting-tracker-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
      .catch(err => console.log('Cache 失敗:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Firebase / Firestore 一律走網路（需要即時同步）
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return; // 讓瀏覽器直接處理
  }
  // 其他請求：網路優先、失敗時用快取
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // 成功時更新快取
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET') cache.put(event.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
