// src/components/Notifications/NotificationSettings.js

import React, { useState, useEffect } from "react";
import notificationService from "../../services/NotificationService";

const NotificationSettings = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    matches: true,
    messages: true,
    likes: true,
    superLikes: true,
    profileViews: false,
    matchExpiring: true,
    email: true,
    push: true,
    inApp: true,
    sound: true,
    vibration: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Check notification support and permission
      if (notificationService.isSupported()) {
        setPermissionStatus(notificationService.getPermissionStatus());
        setIsSubscribed(notificationService.isSubscribed());
      }

      // Load user preferences from API
      const userPrefs = await fetchUserPreferences();
      if (userPrefs) {
        setPreferences((prev) => ({ ...prev, ...userPrefs }));
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch("/api/notifications/preferences", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.preferences;
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    }
    return null;
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const granted = await notificationService.requestPermission();

      if (granted) {
        setPermissionStatus("granted");
        setIsSubscribed(true);
        setPreferences((prev) => ({ ...prev, push: true }));

        // Show success notification
        notificationService.showLocalNotification("Notifications Enabled! 🎉", {
          body: "You'll now receive updates about matches and messages",
          icon: "/logo192.png",
        });
      } else {
        setError("Notification permission denied");
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      setError("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      await notificationService.unsubscribe();
      setIsSubscribed(false);
      setPreferences((prev) => ({ ...prev, push: false }));
    } catch (error) {
      console.error("Failed to disable notifications:", error);
      setError("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      await notificationService.updatePreferences(newPrefs);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setError("Failed to save preferences");
      // Revert on error
      setPreferences(preferences);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const success = await notificationService.sendTestNotification();
      if (!success) {
        setError("Failed to send test notification");
      }
    } catch (error) {
      console.error("Test notification failed:", error);
      setError("Test notification failed");
    } finally {
      setLoading(false);
    }
  };

  const PreferenceToggle = ({
    label,
    description,
    checked,
    onChange,
    disabled = false,
  }) => (
    <div className='flex items-center justify-between py-3'>
      <div className='flex-1'>
        <h4 className='text-sm font-medium text-gray-900'>{label}</h4>
        {description && <p className='text-sm text-gray-500'>{description}</p>}
      </div>
      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          className='sr-only'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-pink-500" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            } mt-0.5 ml-0.5`}
          />
        </div>
      </label>
    </div>
  );

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Notification Settings
          </h2>
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

        <div className='p-6'>
          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>
              {error}
            </div>
          )}

          {/* Notification Support Check */}
          {!notificationService.isSupported() ? (
            <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4'>
              <p className='text-sm'>
                Push notifications are not supported in this browser.
              </p>
            </div>
          ) : (
            <>
              {/* Permission Status */}
              <div className='mb-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>
                  Push Notifications
                </h3>

                {permissionStatus === "default" && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-blue-900'>
                          Enable Push Notifications
                        </p>
                        <p className='text-sm text-blue-700'>
                          Get notified about matches, messages, and more
                        </p>
                      </div>
                      <button
                        onClick={handleEnableNotifications}
                        disabled={loading}
                        className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm'
                      >
                        {loading ? "Enabling..." : "Enable"}
                      </button>
                    </div>
                  </div>
                )}

                {permissionStatus === "denied" && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
                    <p className='text-sm text-red-700'>
                      Notifications are blocked. Please enable them in your
                      browser settings.
                    </p>
                  </div>
                )}

                {permissionStatus === "granted" && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <svg
                          className='w-5 h-5 text-green-500 mr-2'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                            clipRule='evenodd'
                          />
                        </svg>
                        <div>
                          <p className='text-sm font-medium text-green-900'>
                            Notifications Enabled
                          </p>
                          <p className='text-sm text-green-700'>
                            {isSubscribed
                              ? "Subscribed to push notifications"
                              : "Not subscribed"}
                          </p>
                        </div>
                      </div>
                      <div className='flex space-x-2'>
                        <button
                          onClick={handleTestNotification}
                          disabled={loading || !isSubscribed}
                          className='bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 transition-colors'
                        >
                          Test
                        </button>
                        <button
                          onClick={handleDisableNotifications}
                          disabled={loading}
                          className='bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50 transition-colors'
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              <div className='space-y-1'>
                <h3 className='text-lg font-medium text-gray-900 mb-3'>
                  What notifications would you like to receive?
                </h3>

                <PreferenceToggle
                  label='New Matches'
                  description='When someone you liked likes you back'
                  checked={preferences.matches}
                  onChange={(value) => handlePreferenceChange("matches", value)}
                  disabled={!isSubscribed}
                />

                <PreferenceToggle
                  label='New Messages'
                  description='When someone sends you a message'
                  checked={preferences.messages}
                  onChange={(value) =>
                    handlePreferenceChange("messages", value)
                  }
                  disabled={!isSubscribed}
                />

                <PreferenceToggle
                  label='New Likes'
                  description='When someone likes your profile'
                  checked={preferences.likes}
                  onChange={(value) => handlePreferenceChange("likes", value)}
                  disabled={!isSubscribed}
                />

                <PreferenceToggle
                  label='Super Likes'
                  description='When someone super likes your profile'
                  checked={preferences.superLikes}
                  onChange={(value) =>
                    handlePreferenceChange("superLikes", value)
                  }
                  disabled={!isSubscribed}
                />

                <PreferenceToggle
                  label='Profile Views'
                  description='When someone views your profile'
                  checked={preferences.profileViews}
                  onChange={(value) =>
                    handlePreferenceChange("profileViews", value)
                  }
                  disabled={!isSubscribed}
                />

                <PreferenceToggle
                  label='Expiring Matches'
                  description='When your matches are about to expire'
                  checked={preferences.matchExpiring}
                  onChange={(value) =>
                    handlePreferenceChange("matchExpiring", value)
                  }
                  disabled={!isSubscribed}
                />

                <div className='border-t pt-4 mt-6'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Notification Style
                  </h4>

                  <PreferenceToggle
                    label='Sound'
                    description='Play sound with notifications'
                    checked={preferences.sound}
                    onChange={(value) => handlePreferenceChange("sound", value)}
                  />

                  <PreferenceToggle
                    label='Vibration'
                    description='Vibrate device for notifications'
                    checked={preferences.vibration}
                    onChange={(value) =>
                      handlePreferenceChange("vibration", value)
                    }
                  />

                  <PreferenceToggle
                    label='Email Notifications'
                    description='Also send notifications via email'
                    checked={preferences.email}
                    onChange={(value) => handlePreferenceChange("email", value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className='mt-6 pt-4 border-t'>
            <p className='text-xs text-gray-500 text-center'>
              You can change these settings anytime. Notifications help you stay
              connected with your matches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
