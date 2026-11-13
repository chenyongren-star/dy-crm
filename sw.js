const CACHE='dy-crm-v10';
const STATIC=['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./dy-mark.svg','./favicon-32.png','./apple-touch-icon.png','./share-cover-dy.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dy-crm-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/ver.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
  if(event.request.mode==='navigate'||url.pathname.endsWith('/data.js')){
    const key=event.request.mode==='navigate'?'./index.html':event.request;
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy)))}
      return response;
    }).catch(()=>caches.match(key)));return;
  }
  const asset=STATIC.find(name=>new URL(name,self.location.href).pathname===url.pathname);
  if(asset)event.respondWith(caches.match(asset).then(cached=>cached||fetch(event.request)));
});
