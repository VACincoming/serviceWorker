const dataCacheName = 'swDemoData-v1';
const cacheName = 'sw-demo-1';
const filesToCache = [
  'index.html',
  'styles.css',
  'assets/big_image_10mb.jpg',
  'assets/big_image_2mb.jpg'
];

const bigImageUrl = '/assets/big_image_10mb.jpg';
/*
У serviceWorker waitUntil () сообщает браузеру, что работа продолжается до тех пор, пока не будет выполнено обещание, и он не должен завершать работу сервисного работника, если он хочет, чтобы эта работа была завершена. Такая конструкция гарантирует, что сервис-воркер не будет установлен, пока код, переданный внутри waitUntil(), не завершится с успехом.
*/
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
    event.waitUntil(
      caches.open(cacheName)
        .then(cache => cache.addAll(filesToCache))
  );
});

// delete old cache
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
   event.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== cacheName && key !== dataCacheName) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
  ); 
  //Метод claim() интерфейса Clients позволяет активному сервис-воркеру установить себя контролирующим воркером для всех клиентских страниц в своей области видимости. Вызывает событие "controllerchange" на navigator.serviceWorker всех клиентских страниц, контролируемых сервис-воркером.
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetch', event.request.url);
   if (event.request.url.indexOf(bigImageUrl) > -1) {
    event.respondWith(caches.open(dataCacheName)
        .then(cache => {
          return fetch(event.request).then(response => {
            cache.put(event.request.url, response.clone());
              return response;
          });
        })
    );
  } else {
    event.respondWith(
        caches.match(event.request).then(response => {
          return response || fetch(event.request);
        })
    );
  } 
});

function loadImage() {
  return fetch(bigImageUrl);
}

// Message from the client
self.addEventListener('message', event => {
  if (event.data === 'FETCH_IMAGE') {

    for (let i = 0; i < 100000; i++) {
      console.log('Blocking the service worker thread.');
    }

    loadImage().then(response => {
      console.log(response.json())
      //Метод matchAll () интерфейса Clients возвращает Promise для списка объектов Client работника сервиса
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log(client)
          client.postMessage(response.url);
        })
      })
    });
  }
});