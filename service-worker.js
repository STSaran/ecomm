const CACHE_NAME = 'ecoshop-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './admin.html',
    './css/styles.css',
    './css/admin.css',
    './js/app.js',
    './js/db.js',
    './js/admin.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    './images/1.jpg',
    './images/2.png',
    './images/3.png',
    './images/4.png',
    './images/5.avif',
    './images/6.jpg',
    './images/7.jpg',
    './images/8.png',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/screenshot1.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Error caching assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((fetchResponse) => {
                        // Don't cache non-successful responses or non-GET requests
                        if (!fetchResponse || fetchResponse.status !== 200 || 
                            fetchResponse.type !== 'basic' || event.request.method !== 'GET') {
                            return fetchResponse;
                        }
                        // Cache successful network requests
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, fetchResponse.clone());
                                return fetchResponse;
                            });
                    })
                    .catch(() => {
                        // Return a custom offline page or fallback content
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        // For images, return a placeholder
                        if (event.request.destination === 'image') {
                            return fetch(`https://via.placeholder.com/200x200?text=Offline`);
                        }
                        return new Response('Offline content not available');
                    });
            })
    );
}); 