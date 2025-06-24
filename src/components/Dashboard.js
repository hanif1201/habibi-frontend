import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useNavigate } from "react-router-dom";
import ProfileCompletion from "./Profile/ProfileCompletion";
import ProfileEdit from "./Profile/ProfileEdit";
import PhotoUpload from "./Profile/PhotoUpload";
import PhotoGallery from "./Profile/PhotoGallery";
import CardStack from "./Matching/CardStack";
import MatchesList from "./Matching/MatchesList";
import axios from "axios";

const Dashboard = () => {
  const { user, logout, loadUser } = useAuth();
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Fetch detailed profile data and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await axios.get(`${API_URL}/profile`);
        if (profileResponse.data.success) {
          setProfileCompletion(profileResponse.data.profileCompletion);
        }

        // Fetch stats separately with error handling
        try {
          const statsResponse = await axios.get(`${API_URL}/matching/stats`);
          if (statsResponse.data.success) {
            setStats(statsResponse.data.stats);
          }
        } catch (statsError) {
          console.error("Error fetching stats (non-critical):", statsError);
          // Set default stats if the endpoint fails
          setStats({
            likes: 0,
            passes: 0,
            superlikes: 0,
            total: 0,
            matches: 0,
            likesReceived: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, API_URL]);

  const handleLogout = () => {
    logout();
  };

  const handleProfileUpdate = async (updatedUser) => {
    // Reload user data to get updated profile
    await loadUser();

    // Fetch updated profile completion
    try {
      const response = await axios.get(`${API_URL}/profile`);
      if (response.data.success) {
        setProfileCompletion(response.data.profileCompletion);
      }
    } catch (error) {
      console.error("Error fetching updated profile data:", error);
    }
  };

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

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent'>
                Habibi
              </h1>
            </div>

            {/* User Menu */}
            <div className='flex items-center space-x-4'>
              {/* Chat Link */}
              <button
                onClick={() => navigate("/chat")}
                className='relative p-2 text-gray-600 hover:text-pink-600 transition-colors'
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
                  <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </button>

              <span className='text-gray-700'>Welcome, {user?.firstName}!</span>
              <button
                onClick={handleLogout}
                className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Profile Completion Widget */}
        {profileCompletion && profileCompletion.percentage < 100 && (
          <ProfileCompletion
            profileCompletion={profileCompletion}
            onOpenEdit={() => setShowProfileEdit(true)}
            onOpenPhotoUpload={() => setShowPhotoUpload(true)}
          />
        )}

        {/* Tab Navigation */}
        <div className='bg-white rounded-xl shadow-sm border mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex px-6'>
              <button
                onClick={() => setActiveTab("discover")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "discover"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab("matches")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "matches"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Matches ({stats?.matches || 0})
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "photos"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Photos ({user?.photos?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Profile
              </button>
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
                {/* Profile Card */}
                <div className='lg:col-span-1'>
                  <div className='bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border'>
                    <div className='text-center'>
                      {/* Profile Picture */}
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

                        {/* Edit button */}
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

                      {/* User Info */}
                      <h2 className='text-xl font-semibold text-gray-900 mb-1'>
                        {user?.firstName} {user?.lastName}
                      </h2>
                      <p className='text-gray-600 mb-2'>
                        {getAge(user?.dateOfBirth)} years old
                      </p>
                      <p className='text-gray-600 capitalize mb-4'>
                        {user?.gender}
                      </p>

                      {/* Bio */}
                      <div className='text-left'>
                        <h3 className='text-sm font-medium text-gray-900 mb-2'>
                          Bio
                        </h3>
                        <p className='text-gray-600 text-sm'>
                          {user?.bio ||
                            "No bio added yet. Click edit to add one!"}
                        </p>
                      </div>

                      {/* Edit Profile Button */}
                      <button
                        onClick={() => setShowProfileEdit(true)}
                        className='mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200'
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Stats Card */}
                  {stats && (
                    <div className='bg-white rounded-xl shadow-sm border p-6 mt-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Your Stats
                      </h3>
                      <div className='space-y-4'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Total Swipes:</span>
                          <span className='font-semibold'>{stats.total}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Likes Given:</span>
                          <span className='font-semibold text-green-600'>
                            {stats.likes}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Likes Received:</span>
                          <span className='font-semibold text-purple-600'>
                            {stats.likesReceived}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Matches:</span>
                          <span className='font-semibold text-pink-600'>
                            {stats.matches}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Super Likes:</span>
                          <span className='font-semibold text-blue-600'>
                            {stats.superlikes}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className='lg:col-span-2 space-y-6'>
                  <div className='flex justify-between items-center'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Profile Details
                    </h3>
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
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Status:
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user?.isVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user?.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Development Progress */}
        <div className='bg-white rounded-xl shadow-sm p-6 border'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Development Progress
          </h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Phase 1: Authentication
              </span>
              <span className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                ✅ Complete
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Phase 2: User Profiles
              </span>
              <span className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                ✅ Complete
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Phase 3: Matching System
              </span>
              <span className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                ✅ Complete
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Phase 4: Real-time Chat
              </span>
              <span className='bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                ✅ Complete
              </span>
            </div>
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
    </div>
  );
};

export default Dashboard;
