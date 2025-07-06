import React, { useState, useEffect } from "react";
import axios from "axios";

const SafetyCenter = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [privacySettings, setPrivacySettings] = useState({
    showAge: true,
    showDistance: true,
    onlineStatus: true,
    showMe: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Load safety data
  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    try {
      setLoading(true);

      // Load blocked users and privacy settings
      const [profileResponse, blockedResponse] = await Promise.all([
        axios.get(`${API_URL}/profile`),
        axios.get(`${API_URL}/safety/blocked-users`),
      ]);

      if (profileResponse.data.success) {
        const user = profileResponse.data.user;
        setPrivacySettings(user.settings?.privacy || privacySettings);
      }

      if (blockedResponse.data.success) {
        setBlockedUsers(blockedResponse.data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error loading safety data:", error);
      setError("Error loading safety information");
    } finally {
      setLoading(false);
    }
  };

  // Save privacy settings
  const savePrivacySettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/profile/privacy`, {
        privacy: privacySettings,
      });

      if (response.data.success) {
        // Success feedback could be added here
      }
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      setError(
        error.response?.data?.message || "Error saving privacy settings"
      );
    } finally {
      setLoading(false);
    }
  };

  // Unblock a user
  const handleUnblockUser = async (userId) => {
    if (!window.confirm("Are you sure you want to unblock this user?")) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/safety/unblock`, {
        userId,
      });

      if (response.data.success) {
        setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      setError("Error unblocking user");
    }
  };

  // Handle privacy setting change
  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const safetyTips = [
    {
      icon: "🛡️",
      title: "Trust Your Instincts",
      description:
        "If something feels off, don't ignore it. Trust your gut feelings and prioritize your safety.",
    },
    {
      icon: "📍",
      title: "Meet in Public Places",
      description:
        "Always meet new people in busy, public locations for your first few dates.",
    },
    {
      icon: "🚗",
      title: "Arrange Your Own Transportation",
      description:
        "Drive yourself or use your own ride service to maintain control over your transportation.",
    },
    {
      icon: "👥",
      title: "Tell Someone Your Plans",
      description:
        "Let a friend or family member know where you're going and who you're meeting.",
    },
    {
      icon: "💳",
      title: "Protect Personal Information",
      description:
        "Don't share sensitive information like your address, workplace, or financial details too early.",
    },
    {
      icon: "🚨",
      title: "Report Suspicious Behavior",
      description:
        "Help keep our community safe by reporting inappropriate behavior or fake profiles.",
    },
  ];

  const reportReasons = [
    "Inappropriate photos",
    "Harassment or threatening behavior",
    "Fake profile or catfishing",
    "Spam or promotional content",
    "Underage user",
    "Other safety concern",
  ];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-hidden'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>Safety Center</h2>
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
            {[
              { id: "overview", label: "Overview", icon: "🛡️" },
              { id: "privacy", label: "Privacy", icon: "🔒" },
              { id: "blocked", label: "Blocked Users", icon: "🚫" },
              { id: "tips", label: "Safety Tips", icon: "💡" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span className='hidden sm:block'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Content */}
        <div className='h-96 overflow-y-auto p-6'>
          {activeTab === "overview" && (
            <div className='space-y-6'>
              {/* Safety Score */}
              <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
                <div className='flex items-center mb-4'>
                  <div className='w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4'>
                    ✓
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-green-900'>
                      Your Account is Secure
                    </h3>
                    <p className='text-green-700'>
                      You're following safety best practices
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center text-green-700'>
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Email verified
                  </div>
                  <div className='flex items-center text-green-700'>
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Profile photos verified
                  </div>
                  <div className='flex items-center text-green-700'>
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Privacy settings active
                  </div>
                  <div className='flex items-center text-green-700'>
                    <svg
                      className='w-4 h-4 mr-2'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    No reports filed
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Quick Actions
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <button
                    onClick={() => setActiveTab("blocked")}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'
                  >
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3'>
                        <span className='text-red-600'>🚫</span>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Manage Blocked Users
                        </div>
                        <div className='text-sm text-gray-600'>
                          {blockedUsers.length} blocked
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("privacy")}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'
                  >
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3'>
                        <span className='text-blue-600'>🔒</span>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Privacy Settings
                        </div>
                        <div className='text-sm text-gray-600'>
                          Control your visibility
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'>
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3'>
                        <span className='text-yellow-600'>🚨</span>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Report an Issue
                        </div>
                        <div className='text-sm text-gray-600'>
                          Get help or report problems
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("tips")}
                    className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'
                  >
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3'>
                        <span className='text-green-600'>💡</span>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Safety Tips
                        </div>
                        <div className='text-sm text-gray-600'>
                          Learn dating safety best practices
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Recent Security Activity
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3'>
                        <svg
                          className='w-4 h-4 text-green-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Login from new device
                        </div>
                        <div className='text-sm text-gray-600'>
                          Today at 2:30 PM
                        </div>
                      </div>
                    </div>
                    <span className='text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                      Verified
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
                        <svg
                          className='w-4 h-4 text-blue-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Privacy settings updated
                        </div>
                        <div className='text-sm text-gray-600'>
                          Yesterday at 11:15 AM
                        </div>
                      </div>
                    </div>
                    <span className='text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                      Updated
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Profile Visibility
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Show my age
                      </div>
                      <div className='text-sm text-gray-600'>
                        Display your age on your profile
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={privacySettings.showAge}
                        onChange={(e) =>
                          handlePrivacyChange("showAge", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Show distance
                      </div>
                      <div className='text-sm text-gray-600'>
                        Let others see how far away you are
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={privacySettings.showDistance}
                        onChange={(e) =>
                          handlePrivacyChange("showDistance", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Show online status
                      </div>
                      <div className='text-sm text-gray-600'>
                        Let others see when you're online
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={privacySettings.onlineStatus}
                        onChange={(e) =>
                          handlePrivacyChange("onlineStatus", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium text-gray-900'>
                        Show me on Habibi
                      </div>
                      <div className='text-sm text-gray-600'>
                        Make your profile discoverable
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={privacySettings.showMe}
                        onChange={(e) =>
                          handlePrivacyChange("showMe", e.target.checked)
                        }
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data & Privacy */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Data & Privacy
                </h3>
                <div className='space-y-3'>
                  <button className='w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Download my data
                        </div>
                        <div className='text-sm text-gray-600'>
                          Get a copy of your information
                        </div>
                      </div>
                      <svg
                        className='w-5 h-5 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    </div>
                  </button>

                  <button className='w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium text-gray-900'>
                          Delete my account
                        </div>
                        <div className='text-sm text-gray-600'>
                          Permanently remove your account
                        </div>
                      </div>
                      <svg
                        className='w-5 h-5 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className='pt-4 border-t'>
                <button
                  onClick={savePrivacySettings}
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
                    "Save Privacy Settings"
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "blocked" && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Blocked Users ({blockedUsers.length})
                </h3>
                <p className='text-gray-600 text-sm mb-6'>
                  Blocked users can't see your profile or send you messages. You
                  won't see them in discovery either.
                </p>

                {blockedUsers.length === 0 ? (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <span className='text-2xl'>🚫</span>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      No blocked users
                    </h3>
                    <p className='text-gray-600'>
                      You haven't blocked anyone yet.
                    </p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {blockedUsers.map((user) => (
                      <div
                        key={user._id}
                        className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                      >
                        <div className='flex items-center'>
                          {user.primaryPhoto ? (
                            <img
                              src={user.primaryPhoto.url}
                              alt={user.firstName}
                              className='w-12 h-12 rounded-full object-cover mr-3'
                            />
                          ) : (
                            <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3'>
                              <span className='text-gray-600 font-semibold'>
                                {user.firstName?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className='font-medium text-gray-900'>
                              {user.firstName}
                            </div>
                            <div className='text-sm text-gray-600'>
                              Blocked{" "}
                              {new Date(user.blockedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockUser(user._id)}
                          className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors'
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How to Block Someone */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <h4 className='font-medium text-blue-900 mb-2'>
                  How to block someone
                </h4>
                <div className='text-sm text-blue-800 space-y-1'>
                  <p>• Go to their profile and tap the menu (⋮) icon</p>
                  <p>• Select "Block User" from the options</p>
                  <p>• In chat, tap their name and select "Block User"</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tips" && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Dating Safety Tips
                </h3>
                <p className='text-gray-600 mb-6'>
                  Your safety is our top priority. Follow these guidelines to
                  have a safe and enjoyable dating experience.
                </p>

                <div className='space-y-4'>
                  {safetyTips.map((tip, index) => (
                    <div
                      key={index}
                      className='flex items-start p-4 bg-gray-50 rounded-lg'
                    >
                      <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4 text-lg'>
                        {tip.icon}
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900 mb-1'>
                          {tip.title}
                        </h4>
                        <p className='text-gray-600 text-sm'>
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <h4 className='font-medium text-red-900 mb-2'>
                  Emergency Resources
                </h4>
                <div className='text-sm text-red-800 space-y-1'>
                  <p>
                    • Emergency: Call 911 (US) or your local emergency number
                  </p>
                  <p>• National Domestic Violence Hotline: 1-800-799-7233</p>
                  <p>• Crisis Text Line: Text HOME to 741741</p>
                </div>
              </div>

              {/* Report Issues */}
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <h4 className='font-medium text-yellow-900 mb-2'>Need Help?</h4>
                <p className='text-sm text-yellow-800 mb-3'>
                  If you encounter any problems or feel unsafe, please report it
                  immediately.
                </p>
                <button className='w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors'>
                  Report an Issue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyCenter;
