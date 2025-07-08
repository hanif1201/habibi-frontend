// src/services/NotificationService.js

class NotificationService {
  constructor() {
    this.vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    this.apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    this.permission = null;
    this.registration = null;
    this.subscription = null;
  }

  // Initialize the service
  async initialize() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("ServiceWorker registered");

      // Check current permission
      this.permission = Notification.permission;

      if (this.permission === "granted") {
        await this.subscribeToPush();
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      return false;
    }
  }

  // Request permission for notifications
  async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("Notifications not supported");
    }

    if (this.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;

    if (permission === "granted") {
      await this.subscribeToPush();
      return true;
    }

    return false;
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.registration) {
      throw new Error("Service worker not registered");
    }

    try {
      // Get existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
        });
      }

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
      throw error;
    }
  }

  // Send subscription to backend
  async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem("habibi_token");

    try {
      const response = await fetch(`${this.apiUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      console.log("Push subscription saved to server");
    } catch (error) {
      console.error("Failed to send subscription to server:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();

      // Remove from server
      const token = localStorage.getItem("habibi_token");
      await fetch(`${this.apiUrl}/notifications/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
        }),
      });

      this.subscription = null;
      console.log("Unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }

  // Show local notification (for immediate feedback)
  showLocalNotification(title, options = {}) {
    if (this.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    const defaultOptions = {
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: "habibi-notification",
      requireInteraction: false,
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  // Send test notification
  async sendTestNotification() {
    const token = localStorage.getItem("habibi_token");

    try {
      const response = await fetch(`${this.apiUrl}/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to send test notification");
      }

      return true;
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return false;
    }
  }

  // Handle new match notification (both push and email)
  async handleNewMatch(matchData) {
    try {
      // Show local notification if permission granted
      if (this.permission === "granted") {
        this.showLocalNotification("💖 New Match!", {
          body: `You and ${matchData.otherUser.firstName} liked each other!`,
          icon: "/logo192.png",
          tag: "new-match",
          requireInteraction: true,
        });
      }

      // Note: Email notification is handled separately by EmailService
      // to maintain separation of concerns and allow independent error handling

      return true;
    } catch (error) {
      console.error("Failed to handle new match notification:", error);
      return false;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    const token = localStorage.getItem("habibi_token");

    try {
      const response = await fetch(`${this.apiUrl}/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      return true;
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      return false;
    }
  }

  // Get notification history
  async getNotificationHistory(limit = 50) {
    const token = localStorage.getItem("habibi_token");

    try {
      const response = await fetch(
        `${this.apiUrl}/notifications/history?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification history");
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error("Failed to fetch notification history:", error);
      return [];
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get permission status
  getPermissionStatus() {
    return this.permission;
  }

  // Check if notifications are supported
  isSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  // Check if user is subscribed
  isSubscribed() {
    return !!this.subscription;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
