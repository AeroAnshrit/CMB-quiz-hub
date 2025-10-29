const CACHE_NAME = 'engineering-quiz-cache-v2';
// List all the core files your app needs to run
const urlsToCache = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/api.js',
    './js/quiz.js',
    './js/ui.js',
    './js/theme-init.js',
    './images/CMB.png',
    // Add top-level data files that are fetched on page load
    './data/content/about.json',
    './data/content/privacyPolicy.json',
    './data/quizzes/isro/mechanical/subjects.json',
    './data/quizzes/isro/electronics/subjects.json',
    './data/quizzes/isro/computer-science/subjects.json',
    './data/yearWise/isro/mechanical/years.json'
];

// 1. Install the Service Worker
self.addEventListener('install', (event) => {
    // Wait until the cache is opened and all files are added
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Intercept network requests
self.addEventListener('fetch', (event) => {
    event.respondWith(
        // Try to find a match in the cache first
        caches.match(event.request)
            .then((response) => {
                // If a match is found, return the cached response
                if (response) {
                    return response;
                }
                // If not found, fetch from the network
                return fetch(event.request);
            }
        )
    );
});

// 3. (Optional) Clean up old caches if you change CACHE_NAME
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});