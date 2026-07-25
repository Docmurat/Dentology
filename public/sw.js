// Service worker for staff push notifications.
// Lives at the root scope so it can control the whole origin.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Новая заявка" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Новая заявка", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      // A shared tag would collapse several leads into one notification,
      // so each lead gets its own.
      tag: data.tag || `lead-${Date.now()}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/admin/leads" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/admin/leads";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Reuse an already open window instead of piling up new tabs.
      for (const client of list) {
        if (client.url.includes(target) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});