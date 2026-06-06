const CACHE = 'amfels-bew-v1';
const ASSETS = ['/', '/index.html', '/admin.html', '/logo.png', '/manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(cached) {
    return cached || fetch(e.request).catch(function() { return cached; });
  }));
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'Neue Bewerbung!', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || 'Neue Bewerbung – Am Fels', {
    body:    data.body  || 'Eine neue Bewerbung ist eingegangen.',
    icon:    '/logo.png',
    badge:   '/logo.png',
    tag:     'new-application',
    data:    { url: data.url || '/admin.html' },
    actions: [{ action: 'open', title: 'Öffnen' }]
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin.html';
  e.waitUntil(clients.matchAll({ type: 'window' }).then(function(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.includes('admin') && 'focus' in list[i]) return list[i].focus();
    }
    return clients.openWindow(url);
  }));
});
