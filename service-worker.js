const CACHE_NAME = "bramasta-cache-v2";
// Daftar semua file inti yang harus disimpan di cache (offline)
const urlsToCache = [
  "index.html",
  "kita.html",
  "album.html",
  "pustaka.html",
  "forum.html",
  "saran.html",
  "login.html",
  "style.css",
  "script.js",
  "manifest.json",
  "notfound.html" // Opsional: Tambahkan ini jika Anda punya halaman error/offline kustom
  // Tambahkan path ke file ikon dan gambar default di sini
  // contoh: "icons/icon-192.png", "img/favicon-bramasta.ico"
];

// Instalasi service worker → cache file
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error('Failed to cache files:', err);
    })
  );
  self.skipWaiting();
});

// Aktivasi → hapus cache lama (jika ada update versi)
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch → ambil dari cache kalau offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Ambil dari cache jika ada
      return (
        response ||
        // Jika tidak ada di cache, coba fetch dari network
        fetch(event.request).catch(() =>
          // Jika fetch gagal (offline), kembalikan halaman notfound.html
          caches.match("notfound.html") 
        )
      );
    })
  );
});
