const CACHE_NAME = 'vocab-quest-v1';

// All files to pre-cache
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/variables.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/map.css',
  '/css/quiz.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/router.js',
  '/js/db.js',
  '/js/models/vocab.js',
  '/js/models/progress.js',
  '/js/models/errors.js',
  '/js/models/achievements.js',
  '/js/models/settings.js',
  '/js/models/checkin.js',
  '/js/quiz/engine.js',
  '/js/quiz/generators.js',
  '/js/quiz/distractors.js',
  '/js/quiz/scoring.js',
  '/js/screens/home.js',
  '/js/screens/map.js',
  '/js/screens/quiz.js',
  '/js/screens/results.js',
  '/js/screens/errors.js',
  '/js/screens/leaderboard.js',
  '/js/screens/achievements.js',
  '/js/screens/settings.js',
  '/js/components/navbar.js',
  '/js/components/starRating.js',
  '/js/components/progressBar.js',
  '/js/components/badgeIcon.js',
  '/js/components/streakBadge.js',
  '/js/components/modal.js',
  '/js/components/tts.js',
  '/js/utils/shuffle.js',
  '/js/utils/sample.js',
  '/js/utils/levenshtein.js',
  '/js/utils/dateUtils.js',
  '/data/grade6.js',
  '/data/grade7.js',
  '/data/grade8.js',
  '/data/grade9.js',
  '/data/index.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/sounds/correct.wav',
  '/assets/sounds/wrong.wav',
  '/assets/sounds/levelup.wav'
];

// Install: pre-cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use addAll but don't fail on individual missing files during dev
      return Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('SW: failed to cache', url, err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first (offline PWA — everything pre-cached)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache any new requests dynamically (helps during development)
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
