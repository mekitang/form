// Service Worker — 탐구보고서 작성 폼
// 오프라인에서도 앱이 동작하도록 파일을 캐시합니다

const CACHE_NAME = 'research-form-v1';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap'
];

// 설치: 필요한 파일 캐시
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('캐시 저장 중...');
      // 핵심 파일만 필수 캐시, 나머지는 실패해도 무시
      return cache.addAll(['./index.html', './manifest.json']).then(function() {
        return cache.addAll(CACHE_FILES).catch(function() {});
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 요청 가로채기: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', function(event) {
  // chrome-extension, data: 등 무시
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // 성공 응답이면 캐시에 저장
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // 오프라인이고 캐시도 없으면 index.html 반환
        return caches.match('./index.html');
      });
    })
  );
});
