/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching (az összes statikus asset)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Push értesítés fogadása
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json() as { title: string; body: string; url?: string };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: data.url ?? '/reminders' },
      requireInteraction: false,
    })
  );
});

// Értesítésre kattintás
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url: string = (event.notification.data as { url?: string })?.url ?? '/reminders';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) {
          return existing.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
