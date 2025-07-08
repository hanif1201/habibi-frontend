// src/components/Settings/EmailPreferences.js
import React, { useState, useEffect } from "react";
import emailService from "../../services/EmailService";

const EmailPreferences = ({ onClose }) => {
  const [preferences, setPreferences] = useState({
    weeklyMatchSummary: true,
    newMatchNotifications: true,
    messageNotifications: true,
    likeNotifications: false,
    superLikeNotifications: true,
    marketingEmails: false,
    tipsAndAdvice: true,
    eventUpdates: false,
    partnerOffers: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadEmailPreferences();
  }, []);

  const loadEmailPreferences = async () => {
    try {
      setLoading(true);
      const preferences = await emailService.getEmailPreferences();
      setPreferences(preferences);
    } catch (error) {
      console.error("Error loading email preferences:", error);
      setError("Failed to load email preferences");
    } finally {
      setLoading(false);
    }
  };

  const saveEmailPreferences = async () => {
    try {
      setSaving(true);
      setError("");

      const success = await emailService.updateEmailPreferences(preferences);

      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving email preferences:", error);
      setError(error.message || "Failed to save email preferences");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestEmail = async () => {
    try {
      setLoading(true);
      const success = await emailService.sendTestEmail("new-match");
      if (success) {
        alert("Test email sent successfully! Check your inbox.");
      } else {
        alert("Failed to send test email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      alert("Failed to send test email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emailCategories = [
    {
      title: "Dating Activity",
      description: "Notifications about your dating activity",
      preferences: [
        {
          key: "weeklyMatchSummary",
          label: "Weekly Match Summary",
          description:
            "Get a weekly email with your match statistics and activity",
        },
        {
          key: "newMatchNotifications",
          label: "New Match Alerts",
          description: "Email notifications when you get a new match",
        },
        {
          key: "messageNotifications",
          label: "New Message Alerts",
          description: "Email notifications for new messages",
        },
        {
          key: "likeNotifications",
          label: "Like Notifications",
          description: "Get notified when someone likes your profile",
        },
        {
          key: "superLikeNotifications",
          label: "Super Like Notifications",
          description: "Get notified when someone super likes you",
        },
      ],
    },
    {
      title: "Content & Tips",
      description: "Helpful content and dating advice",
      preferences: [
        {
          key: "tipsAndAdvice",
          label: "Dating Tips & Advice",
          description: "Weekly tips to improve your dating success",
        },
        {
          key: "eventUpdates",
          label: "Event Updates",
          description: "Information about local dating events and meetups",
        },
      ],
    },
    {
      title: "Marketing & Promotions",
      description: "Special offers and promotional content",
      preferences: [
        {
          key: "marketingEmails",
          label: "Marketing Emails",
          description: "Promotional emails about new features and offers",
        },
        {
          key: "partnerOffers",
          label: "Partner Offers",
          description: "Special deals from our trusted partners",
        },
      ],
    },
  ];

  const PreferenceToggle = ({
    preference,
    checked,
    onChange,
    disabled = false,
  }) => (
    <div className='flex items-start justify-between py-4'>
      <div className='flex-1 mr-4'>
        <div className='font-medium text-gray-900'>{preference.label}</div>
        <div className='text-sm text-gray-600 mt-1'>
          {preference.description}
        </div>
      </div>
      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          className='sr-only'
          checked={checked}
          onChange={(e) => onChange(preference.key, e.target.checked)}
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

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6'>
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading email preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Email Preferences
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
          {/* Success/Error Messages */}
          {success && (
            <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4'>
              ✅ Email preferences saved successfully!
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>
              {error}
            </div>
          )}

          {/* Global Email Setting */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-medium text-blue-900'>
                  Email Notifications
                </h3>
                <p className='text-sm text-blue-700'>
                  Master toggle for all email notifications
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  className='sr-only'
                  checked={Object.values(preferences).some(Boolean)}
                  onChange={(e) => {
                    const value = e.target.checked;
                    const newPrefs = {};
                    Object.keys(preferences).forEach((key) => {
                      newPrefs[key] = value;
                    });
                    setPreferences(newPrefs);
                  }}
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    Object.values(preferences).some(Boolean)
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      Object.values(preferences).some(Boolean)
                        ? "translate-x-5"
                        : "translate-x-0"
                    } mt-0.5 ml-0.5`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Email Categories */}
          <div className='space-y-6'>
            {emailCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className='border rounded-lg p-4'>
                <div className='mb-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    {category.title}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {category.description}
                  </p>
                </div>

                <div className='divide-y divide-gray-200'>
                  {category.preferences.map((preference) => (
                    <PreferenceToggle
                      key={preference.key}
                      preference={preference}
                      checked={preferences[preference.key]}
                      onChange={handlePreferenceChange}
                      disabled={saving}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Unsubscribe Warning */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6'>
            <div className='flex'>
              <svg
                className='flex-shrink-0 w-5 h-5 text-yellow-400 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='ml-3'>
                <h4 className='text-sm font-medium text-yellow-800'>
                  Important Notice
                </h4>
                <p className='mt-1 text-sm text-yellow-700'>
                  If you turn off all email notifications, you might miss
                  important updates about your matches and messages. We
                  recommend keeping at least match and message notifications
                  enabled.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-between items-center mt-6 pt-4 border-t'>
            <button
              onClick={handleTestEmail}
              disabled={loading}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center'
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
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                  Send Test Email
                </>
              )}
            </button>

            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveEmailPreferences}
                disabled={saving}
                className='px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center'
              >
                {saving ? (
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
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
