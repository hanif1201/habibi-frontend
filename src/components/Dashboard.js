import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useNavigate } from "react-router-dom";
import { useExpirationWarnings } from "../hooks/useExpirationWarnings";
import ProfileCompletion from "./Profile/ProfileCompletion";
import ProfileEdit from "./Profile/ProfileEdit";
import PhotoUpload from "./Profile/PhotoUpload";
import PhotoGallery from "./Profile/PhotoGallery";
import CardStack from "./Matching/CardStack";
import MatchesList from "./Matching/MatchesList";
import NotificationCenter from "./Notifications/NotificationCenter";
import LocationSettings from "./Profile/LocationSettings";
import SafetyCenter from "./Safety/SafetyCenter";
import NotificationSettings from "./Notifications/NotificationSettings";
import notificationService from "../services/NotificationService";
import EmailPreferences from "./Settings/EmailPreferences";
import ExpiringMatchesAlert from "./Matching/ExpiringMatchesAlert";
import Debug from "./Debug";
import axios from "axios";

const Dashboard = () => {
  const { user, logout, loadUser } = useAuth();
  const { unreadCount, conversations, connected } = useChat();
  const navigate = useNavigate();

  // State management
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showEmailPreferences, setShowEmailPreferences] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showExpiringAlert, setShowExpiringAlert] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Initialize expiration warnings
  const { getExpiringSoonMatches } = useExpirationWarnings(matches);

  // Load matches for expiration tracking
  const loadMatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/matching/matches`);
      if (response.data.success) {
        setMatches(response.data.matches || []);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
    }
  };

  // Initialize notifications on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      if (user) {
        const initialized = await notificationService.initialize();
        if (initialized) {
          setNotificationPermission(notificationService.getPermissionStatus());
        }

        // Load recent notifications
        loadRecentNotifications();
      }
    };

    initializeNotifications();
  }, [user]);

  // Fetch comprehensive dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const requests = [
          axios.get(`${API_URL}/profile`),
          axios.get(`${API_URL}/matching/stats`),
          // Add more parallel requests as needed
        ];

        const [profileResponse, statsResponse] = await Promise.allSettled(
          requests
        );

        // Handle profile data
        if (
          profileResponse.status === "fulfilled" &&
          profileResponse.value.data.success
        ) {
          setProfileCompletion(profileResponse.value.data.profileCompletion);
        }

        // Handle stats data with fallback
        if (
          statsResponse.status === "fulfilled" &&
          statsResponse.value.data.success
        ) {
          setStats(statsResponse.value.data.stats);
        } else {
          setStats({
            profile: { views: 0, completionScore: 0 },
            swipes: { total: { likes: 0, passes: 0, superlikes: 0, total: 0 } },
            matches: { total: 0, conversations: 0, pending: 0 },
            social: { likesReceived: 0, popularity: "New" },
          });
        }

        // Load recent notifications
        loadRecentNotifications();

        // Load matches for expiration tracking
        loadMatches();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, API_URL]);

  // Load recent notifications
  const loadRecentNotifications = async () => {
    try {
      const notifications = await notificationService.getNotificationHistory(
        10
      );
      setRecentNotifications(notifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Handle profile updates
  const handleProfileUpdate = async (updatedUser) => {
    await loadUser();
    try {
      const response = await axios.get(`${API_URL}/profile`);
      if (response.data.success) {
        setProfileCompletion(response.data.profileCompletion);
      }
    } catch (error) {
      console.error("Error fetching updated profile data:", error);
    }
  };

  // Utility functions
  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getPrimaryPhoto = () => {
    return user?.photos?.find((photo) => photo.isPrimary) || user?.photos?.[0];
  };

  const getRecentConversations = useMemo(() => {
    return conversations
      .filter((conv) => conv.lastMessage)
      .sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      )
      .slice(0, 3);
  }, [conversations]);

  const formatMessageTime = (timestamp) => {
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

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Quick actions
  const quickActions = [
    {
      icon: "📸",
      label: "Add Photos",
      action: () => setShowPhotoUpload(true),
      disabled: user?.photos?.length >= 6,
    },
    {
      icon: "📍",
      label: "Update Location",
      action: () => setShowLocationSettings(true),
    },
    {
      icon: "🔔",
      label: "Notifications",
      action: () => setShowNotificationSettings(true),
      badge: notificationPermission === "default" ? "!" : null,
    },
    {
      icon: "📧",
      label: "Email Settings",
      action: () => setShowEmailPreferences(true),
    },
    {
      icon: "🛡️",
      label: "Safety Center",
      action: () => setShowSafetyCenter(true),
    },
    {
      icon: "⚙️",
      label: "Edit Profile",
      action: () => setShowProfileEdit(true),
    },
  ];

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='text-red-500 mb-4'>
            <svg
              className='w-16 h-16 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Something went wrong
          </h3>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors'
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Enhanced Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo and Connection Status */}
            <div className='flex items-center space-x-4'>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent'>
                Habibi
              </h1>
              <div className='flex items-center space-x-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                <span className='text-xs text-gray-500'>
                  {connected ? "Connected" : "Reconnecting..."}
                </span>
              </div>
              {/* Notification Permission Indicator */}
              {notificationPermission === "default" && (
                <div className='flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'>
                  <svg
                    className='w-3 h-3'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span>Enable notifications</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className='flex items-center space-x-4'>
              {/* Enhanced Notifications Button */}
              <button
                onClick={() => setShowNotificationSettings(true)}
                className='relative p-2 text-gray-600 hover:text-pink-600 transition-colors group'
                title='Notification Settings'
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
                    d='M15 17h5l-3.5-3.5a50.01 50.01 0 01-3.5-.5V17z'
                  />
                </svg>
                {recentNotifications.filter((n) => !n.isRead).length > 0 && (
                  <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse'>
                    {recentNotifications.filter((n) => !n.isRead).length}
                  </div>
                )}
                {notificationPermission === "default" && (
                  <div className='absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                    !
                  </div>
                )}
              </button>

              {/* Messages */}
              <button
                onClick={() => navigate("/chat")}
                className='relative p-2 text-gray-600 hover:text-pink-600 transition-colors group'
                title='Messages'
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
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
                {unreadCount > 0 && (
                  <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse'>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </button>

              {/* User info and logout */}
              <div className='flex items-center space-x-3'>
                <span className='text-gray-700 hidden sm:block'>
                  Welcome, {user?.firstName}!
                </span>
                <button
                  onClick={handleLogout}
                  className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200'
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Notification Permission Banner */}
        {notificationPermission === "default" && (
          <div className='bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='bg-white bg-opacity-20 rounded-full p-3'>
                  <svg
                    className='w-8 h-8'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>Stay Connected! 🔔</h3>
                  <p className='text-blue-100'>
                    Enable notifications to never miss a match or message
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationSettings(true)}
                className='bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors'
              >
                Enable Now
              </button>
            </div>
          </div>
        )}

        {/* Email Verification Banner */}
        {user && !user.emailVerified && (
          <div className='bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 mb-6 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='bg-white bg-opacity-20 rounded-full p-3'>
                  <svg
                    className='w-8 h-8'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                    <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>
                    Verify Your Email Address 📧
                  </h3>
                  <p className='text-orange-100'>
                    Please check your email and click the verification link to
                    unlock all features
                  </p>
                </div>
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${API_URL}/auth/resend-verification`, {
                        email: user.email,
                      });
                      alert(
                        "Verification email sent! Please check your inbox."
                      );
                    } catch (error) {
                      console.error("Error resending verification:", error);
                      alert(
                        "Failed to resend verification email. Please try again."
                      );
                    }
                  }}
                  className='bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors'
                >
                  Resend Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Completion Alert */}
        {profileCompletion && profileCompletion.percentage < 100 && (
          <ProfileCompletion
            profileCompletion={profileCompletion}
            onOpenEdit={() => setShowProfileEdit(true)}
            onOpenPhotoUpload={() => setShowPhotoUpload(true)}
          />
        )}

        {/* Expiring Matches Alert */}
        {showExpiringAlert && (
          <ExpiringMatchesAlert
            expiringMatches={getExpiringSoonMatches()}
            onClose={() => setShowExpiringAlert(false)}
          />
        )}

        {/* Quick Actions Bar */}
        <div className='bg-white rounded-xl shadow-sm border p-4 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Quick Actions
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                className='relative flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <span className='text-2xl mb-2'>{action.icon}</span>
                <span className='text-sm font-medium text-gray-700'>
                  {action.label}
                </span>
                {action.badge && (
                  <div className='absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold'>
                    {action.badge}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Notifications Panel */}
        {recentNotifications.length > 0 && (
          <div className='bg-white rounded-xl shadow-sm border p-6 mb-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Recent Notifications
              </h3>
              <button
                onClick={() => setShowNotificationSettings(true)}
                className='text-pink-600 hover:text-pink-700 font-medium text-sm'
              >
                View All
              </button>
            </div>
            <div className='space-y-3'>
              {recentNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification._id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "border-gray-200 bg-gray-50"
                      : "border-pink-200 bg-pink-50"
                  }`}
                >
                  <div className='flex-shrink-0'>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p
                      className={`text-sm font-medium ${
                        notification.isRead ? "text-gray-900" : "text-pink-900"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p
                      className={`text-sm ${
                        notification.isRead ? "text-gray-600" : "text-pink-700"
                      }`}
                    >
                      {notification.body}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {notification.timeAgo}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className='w-2 h-2 bg-pink-500 rounded-full'></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Stats & Activity Overview */}
        {stats && (
          <div className='bg-white rounded-xl shadow-sm border p-6 mb-6'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Your Activity Overview
              </h3>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-500'>Popularity:</span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stats.social.popularity === "Very High"
                      ? "bg-green-100 text-green-800"
                      : stats.social.popularity === "High"
                      ? "bg-blue-100 text-blue-800"
                      : stats.social.popularity === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {stats.social.popularity}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              {/* Profile Stats */}
              <div className='text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600 mb-1'>
                  {stats.profile.views}
                </div>
                <div className='text-sm text-gray-600 mb-2'>Profile Views</div>
                <div className='text-xs text-purple-600 font-medium'>
                  {stats.profile.completionScore}% Complete
                </div>
              </div>

              {/* Matches Stats */}
              <div className='text-center p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg'>
                <div className='text-2xl font-bold text-pink-600 mb-1'>
                  {stats.matches.total}
                </div>
                <div className='text-sm text-gray-600 mb-2'>Total Matches</div>
                <div className='text-xs text-pink-600 font-medium'>
                  {stats.matches.conversations} Active Chats
                </div>
              </div>

              {/* Swipe Stats */}
              <div className='text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600 mb-1'>
                  {stats.swipes.total.likes}
                </div>
                <div className='text-sm text-gray-600 mb-2'>Likes Given</div>
                <div className='text-xs text-blue-600 font-medium'>
                  {stats.matches?.conversionRate || 0}% Match Rate
                </div>
              </div>

              {/* Social Stats */}
              <div className='text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600 mb-1'>
                  {stats.social.likesReceived}
                </div>
                <div className='text-sm text-gray-600 mb-2'>Likes Received</div>
                <div className='text-xs text-green-600 font-medium'>
                  {stats.matches?.messageRate || 0}% Message Rate
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className='mt-6 space-y-4'>
              <div>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                  <span>Profile Completion</span>
                  <span>{stats.profile.completionScore}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500'
                    style={{ width: `${stats.profile.completionScore}%` }}
                  ></div>
                </div>
              </div>

              {stats.matches.total > 0 && (
                <div>
                  <div className='flex justify-between text-sm text-gray-600 mb-1'>
                    <span>Conversation Success</span>
                    <span>{stats.matches?.messageRate || 0}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${stats.matches?.messageRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity Highlights */}
            {(unreadCount > 0 || stats.matches.pending > 0) && (
              <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                {unreadCount > 0 && (
                  <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='text-lg font-bold text-red-600'>
                          {unreadCount}
                        </div>
                        <div className='text-sm text-red-700'>
                          Unread Messages
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/chat")}
                        className='bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-600 transition-colors'
                      >
                        View
                      </button>
                    </div>
                  </div>
                )}

                {stats.matches.pending > 0 && (
                  <div className='p-4 bg-orange-50 rounded-lg border border-orange-200'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='text-lg font-bold text-orange-600'>
                          {stats.matches.pending}
                        </div>
                        <div className='text-sm text-orange-700'>
                          Pending Matches
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("matches")}
                        className='bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-600 transition-colors'
                      >
                        Start Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Conversations Preview */}
            {getRecentConversations.length > 0 && (
              <div className='mt-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h4 className='text-md font-medium text-gray-900'>
                    Recent Conversations
                  </h4>
                  <button
                    onClick={() => navigate("/chat")}
                    className='text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center'
                  >
                    View All
                    <svg
                      className='w-4 h-4 ml-1'
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
                  </button>
                </div>
                <div className='space-y-3'>
                  {getRecentConversations.map((conv) => (
                    <div
                      key={conv.matchId}
                      onClick={() => navigate("/chat")}
                      className='flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100'
                    >
                      <div className='relative'>
                        {conv.user.primaryPhoto ? (
                          <img
                            src={conv.user.primaryPhoto.url}
                            alt={conv.user.firstName}
                            className='w-12 h-12 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold'>
                            {conv.user.firstName.charAt(0)}
                          </div>
                        )}
                        {conv.unreadCount > 0 && (
                          <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium'>
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <div className='text-sm font-medium text-gray-900 truncate'>
                            {conv.user.firstName}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </div>
                        </div>
                        <div className='text-xs text-gray-500 truncate mt-1'>
                          {conv.lastMessage.isFromMe && "You: "}
                          {conv.lastMessage.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className='bg-white rounded-xl shadow-sm border mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex px-6'>
              {[
                { id: "discover", label: "Discover", icon: "🔍" },
                {
                  id: "matches",
                  label: `Matches (${stats?.matches?.total || 0})`,
                  icon: "💝",
                  badge: unreadCount,
                },
                {
                  id: "photos",
                  label: `Photos (${user?.photos?.length || 0})`,
                  icon: "📸",
                },
                { id: "profile", label: "Profile", icon: "👤" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium'>
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === "discover" && (
              <div>
                {profileCompletion && profileCompletion.percentage < 50 ? (
                  <div className='text-center py-12'>
                    <div className='mb-6'>
                      <svg
                        className='mx-auto h-16 w-16 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    </div>
                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                      Complete your profile to start discovering
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      Add photos and complete your profile to find amazing
                      matches!
                    </p>
                    <button
                      onClick={() => setShowProfileEdit(true)}
                      className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
                    >
                      Complete Profile
                    </button>
                  </div>
                ) : (
                  <CardStack />
                )}
              </div>
            )}

            {activeTab === "matches" && <MatchesList />}

            {activeTab === "photos" && (
              <div>
                <div className='flex justify-between items-center mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Your Photos
                  </h3>
                  <button
                    onClick={() => setShowPhotoUpload(true)}
                    disabled={user?.photos?.length >= 6}
                    className='bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                  >
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
                        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                      />
                    </svg>
                    Add Photo
                  </button>
                </div>
                <PhotoGallery
                  user={user}
                  onPhotosUpdate={handleProfileUpdate}
                />
              </div>
            )}

            {activeTab === "profile" && (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Enhanced Profile Card */}
                <div className='lg:col-span-1'>
                  <div className='bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border'>
                    <div className='text-center'>
                      <div className='relative w-24 h-24 mx-auto mb-4'>
                        {getPrimaryPhoto() ? (
                          <img
                            src={getPrimaryPhoto().url}
                            alt='Profile'
                            className='w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg'
                          />
                        ) : (
                          <div className='w-24 h-24 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg'>
                            <span className='text-2xl font-bold text-white'>
                              {user?.firstName?.charAt(0)}
                              {user?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => setShowPhotoUpload(true)}
                          className='absolute -bottom-1 -right-1 bg-pink-500 text-white rounded-full p-2 hover:bg-pink-600 transition-colors shadow-lg'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                            />
                          </svg>
                        </button>
                      </div>

                      <h2 className='text-xl font-semibold text-gray-900 mb-1'>
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <p className='text-gray-600 mb-2'>
                        {getAge(user?.dateOfBirth)} years old
                      </p>
                      <p className='text-gray-600 capitalize mb-4'>
                        {user?.gender}
                      </p>

                      {/* Verification Badge */}
                      {user?.verification?.isVerified && (
                        <div className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4'>
                          <svg
                            className='w-4 h-4 mr-1'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Verified
                        </div>
                      )}

                      <div className='text-left'>
                        <h3 className='text-sm font-medium text-gray-900 mb-2'>
                          Bio
                        </h3>
                        <p className='text-gray-600 text-sm'>
                          {user?.bio ||
                            "No bio added yet. Click edit to add one!"}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowProfileEdit(true)}
                        className='mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200'
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Stats Card */}
                  {stats && (
                    <div className='bg-white rounded-xl shadow-sm border p-6 mt-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Your Statistics
                      </h3>
                      <div className='space-y-4'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Profile Views:</span>
                          <span className='font-semibold text-purple-600'>
                            {stats.profile.views}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Total Swipes:</span>
                          <span className='font-semibold'>
                            {stats.swipes.total.total}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Likes Given:</span>
                          <span className='font-semibold text-green-600'>
                            {stats.swipes.total.likes}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Likes Received:</span>
                          <span className='font-semibold text-purple-600'>
                            {stats.social.likesReceived}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Matches:</span>
                          <span className='font-semibold text-pink-600'>
                            {stats.matches.total}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Super Likes:</span>
                          <span className='font-semibold text-blue-600'>
                            {stats.swipes.total.superlikes}
                          </span>
                        </div>
                        <div className='pt-2 border-t'>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-600'>Popularity:</span>
                            <span
                              className={`font-semibold px-2 py-1 rounded-full text-xs ${
                                stats.social.popularity === "Very High"
                                  ? "bg-green-100 text-green-800"
                                  : stats.social.popularity === "High"
                                  ? "bg-blue-100 text-blue-800"
                                  : stats.social.popularity === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {stats.social.popularity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Profile Details */}
                <div className='lg:col-span-2 space-y-6'>
                  <div className='flex justify-between items-center'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Profile Details
                    </h3>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => setShowLocationSettings(true)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center'
                      >
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
                            d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                          />
                        </svg>
                        Location
                      </button>
                      <button
                        onClick={() => setShowProfileEdit(true)}
                        className='bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center'
                      >
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
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          />
                        </svg>
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <h4 className='font-medium text-gray-900 mb-4'>
                      Basic Information
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Name:
                        </span>
                        <p className='text-gray-900'>
                          {user?.firstName} {user?.lastName}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Age:
                        </span>
                        <p className='text-gray-900'>
                          {getAge(user?.dateOfBirth)} years old
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Gender:
                        </span>
                        <p className='text-gray-900 capitalize'>
                          {user?.gender}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Email:
                        </span>
                        <p className='text-gray-900'>{user?.email}</p>
                      </div>
                    </div>
                    {user?.bio && (
                      <div className='mt-4'>
                        <span className='text-sm font-medium text-gray-500'>
                          Bio:
                        </span>
                        <p className='text-gray-900 mt-1'>{user.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Preferences */}
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <h4 className='font-medium text-gray-900 mb-4'>
                      Dating Preferences
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Age Range:
                        </span>
                        <p className='text-gray-900'>
                          {user?.preferences?.ageRange?.min || 18} -{" "}
                          {user?.preferences?.ageRange?.max || 50} years
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Max Distance:
                        </span>
                        <p className='text-gray-900'>
                          {user?.preferences?.maxDistance || 50} km
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Interested In:
                        </span>
                        <p className='text-gray-900 capitalize'>
                          {user?.preferences?.interestedIn === "both"
                            ? "Everyone"
                            : user?.preferences?.interestedIn === "male"
                            ? "Men"
                            : user?.preferences?.interestedIn === "female"
                            ? "Women"
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className='bg-gray-50 rounded-lg p-6'>
                    <h4 className='font-medium text-gray-900 mb-4'>
                      Account Information
                    </h4>
                    <div className='space-y-3'>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Member since:
                        </span>
                        <p className='text-gray-900'>
                          {user?.createdAt &&
                            new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div>
                          <span className='text-sm font-medium text-gray-500'>
                            Verification Status:
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                              user?.verification?.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {user?.verification?.isVerified
                              ? "✓ Verified"
                              : "⏳ Pending"}
                          </span>
                        </div>
                        {!user?.verification?.isVerified && (
                          <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                            Get Verified
                          </button>
                        )}
                      </div>
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Subscription:
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                            user?.subscription?.type === "premium"
                              ? "bg-purple-100 text-purple-800"
                              : user?.subscription?.type === "gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user?.subscription?.type?.charAt(0).toUpperCase() +
                            user?.subscription?.type?.slice(1) || "Free"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showProfileEdit && (
        <ProfileEdit
          user={user}
          onProfileUpdate={handleProfileUpdate}
          onClose={() => setShowProfileEdit(false)}
        />
      )}

      {showPhotoUpload && (
        <PhotoUpload
          user={user}
          onPhotosUpdate={handleProfileUpdate}
          onClose={() => setShowPhotoUpload(false)}
        />
      )}

      {showLocationSettings && (
        <LocationSettings
          user={user}
          onLocationUpdate={handleProfileUpdate}
          onClose={() => setShowLocationSettings(false)}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={(id) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
          }}
        />
      )}

      {showSafetyCenter && (
        <SafetyCenter onClose={() => setShowSafetyCenter(false)} />
      )}

      {/* New Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => {
            setShowNotificationSettings(false);
            setNotificationPermission(
              notificationService.getPermissionStatus()
            );
            loadRecentNotifications();
          }}
        />
      )}

      {/* Email Preferences Modal */}
      {showEmailPreferences && (
        <EmailPreferences onClose={() => setShowEmailPreferences(false)} />
      )}

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === "development" && <Debug />}
    </div>
  );

  // Helper function to get notification icons
  function getNotificationIcon(type) {
    const iconMap = {
      new_match: "💖",
      new_message: "💬",
      new_like: "❤️",
      super_like: "⭐",
      profile_view: "👀",
      match_expiring: "⏰",
      match_expiring_24h: "⏰",
      match_expiring_12h: "⚠️",
      match_expiring_6h: "🚨",
      match_expiring_2h: "🔥",
      match_expiring_1h: "💥",
      welcome: "🎉",
      test: "🧪",
      system: "⚙️",
      promotion: "🎁",
    };

    return <span className='text-2xl'>{iconMap[type] || "🔔"}</span>;
  }
};

export default Dashboard;
