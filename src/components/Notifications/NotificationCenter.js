import React, { useState, useEffect } from "react";
import axios from "axios";

const NotificationCenter = ({ notifications, onClose, onMarkAsRead }) => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [settings, setSettings] = useState({
    matches: true,
    messages: true,
    likes: true,
    email: true,
    push: true,
    sound: true,
    vibration: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Load current notification settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      if (response.data.success && response.data.user.settings?.notifications) {
        setSettings(response.data.user.settings.notifications);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/profile/notifications`, {
        notifications: settings,
      });

      if (response.data.success) {
        // Success feedback
        setError(""); // Clear any previous errors
        // You could add a success message here
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setError(error.response?.data?.message || "Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle setting change
  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      setError("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  // Handle push notification toggle
  const handlePushToggle = async (enabled) => {
    if (enabled) {
      const permitted = await requestPushPermission();
      if (!permitted) {
        setError("Push notifications permission denied");
        return;
      }
    }
    handleSettingChange("push", enabled);
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "match":
        return "❤️";
      case "message":
        return "💬";
      case "like":
        return "👍";
      case "super_like":
        return "⭐";
      case "profile_view":
        return "👀";
      default:
        return "🔔";
    }
  };

  // Get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case "match":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "message":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "like":
        return "bg-green-100 text-green-800 border-green-200";
      case "super_like":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "profile_view":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
    });
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/notifications/clear`);
      // You would need to update the parent component here
      onClose();
    } catch (error) {
      console.error("Error clearing notifications:", error);
      setError("Error clearing notifications");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-hidden'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>Notifications</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className='border-b'>
          <nav className='flex'>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === "notifications"
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "settings"
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Content */}
        <div className='h-96 overflow-y-auto'>
          {activeTab === "notifications" && (
            <div className='p-6'>
              {/* Action Buttons */}
              {notifications.length > 0 && (
                <div className='flex justify-between mb-4'>
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className='text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed'
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className='text-red-600 hover:text-red-700 text-sm font-medium'
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Notifications List */}
              {notifications.length === 0 ? (
                <div className='text-center py-8'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400 mb-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 17h5l-3.5-3.5a50.01 50.01 0 01-3.5-.5V17z'
                    />
                  </svg>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    No notifications yet
                  </h3>
                  <p className='text-gray-600'>
                    When you have new matches, messages, or likes, they'll
                    appear here!
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                        notification.read
                          ? "bg-white border-gray-200"
                          : "bg-blue-50 border-blue-200 shadow-sm"
                      }`}
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <div className='flex items-start space-x-3'>
                        {/* Notification Icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Notification Content */}
                        <div className='flex-1 min-w-0'>
                          <p
                            className={`text-sm ${
                              notification.read
                                ? "text-gray-600"
                                : "text-gray-900 font-medium"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {formatNotificationTime(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className='flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full'></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className='p-6 space-y-6'>
              {/* In-App Notifications */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  In-App Notifications
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        New Matches
                      </div>
                      <div className='text-sm text-gray-600'>
                        Get notified when you have a new match
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.matches}
                        onChange={(e) =>
                          handleSettingChange("matches", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        New Messages
                      </div>
                      <div className='text-sm text-gray-600'>
                        Get notified when you receive new messages
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.messages}
                        onChange={(e) =>
                          handleSettingChange("messages", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Likes & Super Likes
                      </div>
                      <div className='text-sm text-gray-600'>
                        Get notified when someone likes you
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.likes}
                        onChange={(e) =>
                          handleSettingChange("likes", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Push Notifications
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Push Notifications
                      </div>
                      <div className='text-sm text-gray-600'>
                        Receive notifications even when the app is closed
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.push}
                        onChange={(e) => handlePushToggle(e.target.checked)}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {settings.push && (
                    <>
                      <div className='flex items-center justify-between pl-4'>
                        <div>
                          <div className='font-medium text-gray-900'>Sound</div>
                          <div className='text-sm text-gray-600'>
                            Play notification sounds
                          </div>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.sound}
                            onChange={(e) =>
                              handleSettingChange("sound", e.target.checked)
                            }
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className='flex items-center justify-between pl-4'>
                        <div>
                          <div className='font-medium text-gray-900'>
                            Vibration
                          </div>
                          <div className='text-sm text-gray-600'>
                            Vibrate on notifications (mobile only)
                          </div>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.vibration}
                            onChange={(e) =>
                              handleSettingChange("vibration", e.target.checked)
                            }
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Email Notifications */}
              <div>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Email Notifications
                </h3>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      Email Updates
                    </div>
                    <div className='text-sm text-gray-600'>
                      Receive weekly summaries and updates via email
                    </div>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.email}
                      onChange={(e) =>
                        handleSettingChange("email", e.target.checked)
                      }
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className='pt-4 border-t'>
                <button
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  className='w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center'
                >
                  {loading ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
