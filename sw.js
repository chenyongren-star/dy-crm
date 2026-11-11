const CACHE = 'dy-crm-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' }));
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var req = e.request;

  // 页面（导航请求）：network-first + 绕过 HTTP 缓存，永远拿到最新版；网络失败才降级缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // data.js（数据文件）：**网络优先 + 绕过一切缓存**，永远拉最新数据；离线才降级缓存
  if (req.url.indexOf('data.js') !== -1) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  // manifest（应用名/图标配置）：网络优先，改名字后能立刻生效，不用再改缓存版本号
  if (req.url.indexOf('manifest') !== -1) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match(req);
      })
    );
    return;
  }

  // 其他静态资源：cache-first
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match('./');
      });
    })
  );
});
