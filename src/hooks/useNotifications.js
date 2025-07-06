// src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from "react";
import notificationService from "../services/NotificationService";

export const useNotifications = () => {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = useCallback(async () => {
    try {
      setLoading(true);

      if (notificationService.isSupported()) {
        await notificationService.initialize();
        setPermission(notificationService.getPermissionStatus());
        setIsSubscribed(notificationService.isSubscribed());
      }

      await loadNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const notificationHistory =
        await notificationService.getNotificationHistory(50);
      setNotifications(notificationHistory);

      const unread = notificationHistory.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const granted = await notificationService.requestPermission();

      if (granted) {
        setPermission("granted");
        setIsSubscribed(true);

        // Show welcome notification
        showLocalNotification(
          "Notifications Enabled! 🎉",
          "You'll now receive updates about matches and messages"
        );
      } else {
        setError("Notification permission denied");
      }

      return granted;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      await notificationService.unsubscribe();
      setIsSubscribed(false);
      setPermission(notificationService.getPermissionStatus());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (preferences) => {
    try {
      await notificationService.updatePreferences(preferences);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const showLocalNotification = useCallback(
    (title, body, options = {}) => {
      if (permission === "granted") {
        return notificationService.showLocalNotification(title, {
          body,
          icon: "/logo192.png",
          ...options,
        });
      }
    },
    [permission]
  );

  const sendTestNotification = useCallback(async () => {
    try {
      setLoading(true);
      const success = await notificationService.sendTestNotification();

      if (!success) {
        setError("Failed to send test notification");
      }

      return success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const token = localStorage.getItem("habibi_token");
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setNotifications((prev) =>
            prev.filter((n) => n._id !== notificationId)
          );

          const notification = notifications.find(
            (n) => n._id === notificationId
          );
          if (notification && !notification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },
    [notifications]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Listen for new notifications from service worker
  useEffect(() => {
    const handleNewNotification = (event) => {
      if (event.data?.type === "NOTIFICATION_RECEIVED") {
        loadNotifications();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleNewNotification);

    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleNewNotification
      );
    };
  }, [loadNotifications]);

  return {
    // State
    permission,
    isSubscribed,
    notifications,
    unreadCount,
    loading,
    error,

    // Actions
    requestPermission,
    unsubscribe,
    updatePreferences,
    showLocalNotification,
    sendTestNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    clearError,

    // Computed
    isSupported: notificationService.isSupported(),
    hasPermission: permission === "granted",
    needsPermission: permission === "default",
    isBlocked: permission === "denied",
  };
};
