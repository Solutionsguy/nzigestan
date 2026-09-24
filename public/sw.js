const CACHE_NAME = "nzigestan-v1";
const OFFLINE_PAGE = "/offline";

const ASSETS_TO_CACHE = [
  "/",
  "/live",
  "/episodes",
  "/tours",
  "/merch",
  "/cart",
  "/admin",
  "/assets/branding/locust-emblem-hq-transparent.png",
  "/assets/studio/homepage-hero.png",
  "/assets/studio/studio-pod.png",
];

// Install event — cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching core assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API calls and third-party resources
  if (event.request.url.includes("/api/") || event.request.url.includes("youtube.com")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fall back to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline page for navigation requests
        if (event.request.destination === "document") {
          return caches.match(OFFLINE_PAGE);
        }
      })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "submit-order") {
    event.waitUntil(syncOrder());
  }
});

async function syncOrder() {
  // Implementation for syncing pending orders when online
  console.log("[SW] Background sync: submitting pending orders");
}

// Push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New update from The Republic of Nzigestan",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrationPattern: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Live",
        icon: "/icons/live.png",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Nzigestan Update", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("https://nzigestan.com/live")
    );
  }
});
