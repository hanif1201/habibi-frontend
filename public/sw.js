// public/sw.js

const CACHE_NAME = "habibi-v1";
const API_URL = "http://localhost:5000/api";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  let notificationData = {
    title: "Habibi",
    body: "You have a new notification",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "habibi-notification",
    data: {
      url: "/",
      timestamp: Date.now(),
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
      };
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  // Customize notification based on type
  if (notificationData.type) {
    switch (notificationData.type) {
      case "new_match":
        notificationData.title = "💖 New Match!";
        notificationData.body = `You and ${notificationData.userName} liked each other!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "match";
        notificationData.requireInteraction = true;
        break;

      case "new_message":
        notificationData.title = `💬 ${notificationData.userName}`;
        notificationData.body =
          notificationData.message || "Sent you a message";
        notificationData.data.url = "/chat";
        notificationData.tag = "message";
        break;

      case "new_like":
        notificationData.title = "❤️ Someone likes you!";
        notificationData.body = "Check out who swiped right on you";
        notificationData.data.url = "/dashboard";
        notificationData.tag = "like";
        break;

      case "super_like":
        notificationData.title = "⭐ Super Like!";
        notificationData.body = `${notificationData.userName} super liked you!`;
        notificationData.data.url = "/dashboard";
        notificationData.tag = "superlike";
        notificationData.requireInteraction = true;
        break;

      case "match_expiring_24h":
        notificationData.title = "⏰ Match Expires Tomorrow";
        notificationData.body = `Your match with ${notificationData.userName} expires in 24 hours. Send a message to keep the connection!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring-24h";
        notificationData.requireInteraction = false;
        break;

      case "match_expiring_12h":
        notificationData.title = "⚠️ Match Expires Soon";
        notificationData.body = `Your match with ${notificationData.userName} expires in 12 hours. Don't miss out!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring-12h";
        notificationData.requireInteraction = false;
        break;

      case "match_expiring_6h":
        notificationData.title = "🚨 Match Expires Today";
        notificationData.body = `Your match with ${notificationData.userName} expires in 6 hours. Time to make a move!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring-6h";
        notificationData.requireInteraction = true;
        break;

      case "match_expiring_2h":
        notificationData.title = "🔥 URGENT: Match Expires Soon";
        notificationData.body = `Your match with ${notificationData.userName} expires in 2 hours! Send a message now!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring-2h";
        notificationData.requireInteraction = true;
        notificationData.vibrate = [300, 100, 300, 100, 300];
        break;

      case "match_expiring_1h":
        notificationData.title = "💥 FINAL WARNING: Match Expires";
        notificationData.body = `Your match with ${notificationData.userName} expires in 1 hour! This is your last chance!`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring-1h";
        notificationData.requireInteraction = true;
        notificationData.vibrate = [500, 100, 500, 100, 500, 100, 500];
        break;

      case "match_expiring":
        notificationData.title = "⏰ Match Expiring Soon";
        notificationData.body = `Your match with ${notificationData.userName} expires in ${notificationData.timeLeft}`;
        notificationData.data.url = "/chat";
        notificationData.tag = "expiring";
        break;

      case "profile_view":
        notificationData.title = "👀 Profile View";
        notificationData.body = "Someone viewed your profile";
        notificationData.data.url = "/dashboard";
        notificationData.tag = "view";
        break;

      default:
        break;
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction || false,
      actions: getNotificationActions(notificationData.type),
      image: notificationData.image || null,
      silent: notificationData.silent || false,
      vibrate: notificationData.vibrate || [200, 100, 200],
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case "reply":
        // Open chat page for quick reply
        handleNotificationAction("reply", event.notification.data);
        return;
      case "view_profile":
        // Open profile page
        handleNotificationAction("view_profile", event.notification.data);
        return;
      case "dismiss":
        // Just close notification
        return;
    }
  }

  // Open or focus the app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate
            client.focus();
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              url: urlToOpen,
              data: event.notification.data,
            });
            return;
          }
        }

        // Open new window
        return self.clients.openWindow(self.location.origin + urlToOpen);
      })
  );
});

// Handle notification actions
function handleNotificationAction(action, data) {
  switch (action) {
    case "reply":
      // Send analytics event
      sendAnalyticsEvent("notification_reply_clicked", data);
      break;
    case "view_profile":
      sendAnalyticsEvent("notification_profile_clicked", data);
      break;
  }
}

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case "new_message":
      return [
        {
          action: "reply",
          title: "💬 Reply",
          icon: "/icons/reply.png",
        },
        {
          action: "dismiss",
          title: "✕ Dismiss",
          icon: "/icons/dismiss.png",
        },
      ];

    case "new_match":
      return [
        {
          action: "reply",
          title: "💬 Say Hi",
          icon: "/icons/chat.png",
        },
        {
          action: "view_profile",
          title: "👤 View Profile",
          icon: "/icons/profile.png",
        },
      ];

    case "new_like":
    case "super_like":
      return [
        {
          action: "view_profile",
          title: "👤 See Who",
          icon: "/icons/profile.png",
        },
        {
          action: "dismiss",
          title: "✕ Later",
          icon: "/icons/dismiss.png",
        },
      ];

    default:
      return [];
  }
}

// Send analytics event
function sendAnalyticsEvent(eventName, data) {
  // Send to analytics service
  fetch(`${API_URL}/analytics/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: eventName,
      data: data,
      timestamp: Date.now(),
    }),
  }).catch((error) => {
    console.error("Failed to send analytics event:", error);
  });
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "send-message") {
    event.waitUntil(syncMessages());
  }
});

// Sync offline messages
async function syncMessages() {
  try {
    // Get offline messages from IndexedDB
    const offlineMessages = await getOfflineMessages();

    for (const message of offlineMessages) {
      try {
        await sendMessageToServer(message);
        await removeOfflineMessage(message.id);
      } catch (error) {
        console.error("Failed to sync message:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Helper functions for offline message handling
async function getOfflineMessages() {
  // Implementation would use IndexedDB
  return [];
}

async function sendMessageToServer(message) {
  // Implementation would send to API
  return fetch(`${API_URL}/chat/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

async function removeOfflineMessage(messageId) {
  // Implementation would remove from IndexedDB
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  switch (event.data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "GET_VERSION":
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
  }
});

// Fetch event for caching strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip for API requests
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});
