import React from "react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getAge = (dateOfBirth) => {
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* User Profile Card */}
          <div className='md:col-span-1'>
            <div className='bg-white rounded-xl shadow-sm p-6 border'>
              <div className='text-center'>
                {/* Profile Picture Placeholder */}
                <div className='w-24 h-24 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center'>
                  <span className='text-2xl font-bold text-white'>
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>

                {/* User Info */}
                <h2 className='text-xl font-semibold text-gray-900 mb-1'>
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className='text-gray-600 mb-2'>
                  {user?.dateOfBirth && `${getAge(user.dateOfBirth)} years old`}
                </p>
                <p className='text-gray-600 capitalize mb-4'>{user?.gender}</p>

                {/* Bio */}
                <div className='text-left'>
                  <h3 className='text-sm font-medium text-gray-900 mb-2'>
                    Bio
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    {user?.bio || "No bio added yet. Click edit to add one!"}
                  </p>
                </div>

                {/* Edit Profile Button */}
                <button className='mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200'>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className='bg-white rounded-xl shadow-sm p-6 border mt-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Account Info
              </h3>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Email:
                  </span>
                  <p className='text-gray-900'>{user?.email}</p>
                </div>
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

          {/* Main Dashboard Content */}
          <div className='md:col-span-2'>
            {/* Welcome Message */}
            <div className='bg-gradient-to-r from-pink-500 to-red-500 rounded-xl p-6 text-white mb-8'>
              <h2 className='text-2xl font-bold mb-2'>
                🎉 Welcome to Habibi, {user?.firstName}!
              </h2>
              <p className='text-pink-100'>
                You've successfully completed Phase 1 - Authentication! Your
                account is set up and ready. Next up: we'll add profile
                customization and the matching system.
              </p>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8'>
              <div className='bg-white rounded-xl shadow-sm p-6 border text-center'>
                <div className='text-3xl font-bold text-pink-500 mb-2'>0</div>
                <div className='text-gray-600'>Matches</div>
              </div>
              <div className='bg-white rounded-xl shadow-sm p-6 border text-center'>
                <div className='text-3xl font-bold text-blue-500 mb-2'>0</div>
                <div className='text-gray-600'>Likes</div>
              </div>
              <div className='bg-white rounded-xl shadow-sm p-6 border text-center'>
                <div className='text-3xl font-bold text-green-500 mb-2'>0</div>
                <div className='text-gray-600'>Messages</div>
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className='bg-white rounded-xl shadow-sm p-6 border'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Coming Soon
              </h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='flex items-center p-4 bg-gray-50 rounded-lg'>
                  <div className='flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-pink-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                      />
                    </svg>
                  </div>
                  <div className='ml-4'>
                    <h4 className='text-sm font-medium text-gray-900'>
                      Profile Photos
                    </h4>
                    <p className='text-sm text-gray-500'>
                      Upload and manage your photos
                    </p>
                  </div>
                </div>

                <div className='flex items-center p-4 bg-gray-50 rounded-lg'>
                  <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-blue-600'
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
                  </div>
                  <div className='ml-4'>
                    <h4 className='text-sm font-medium text-gray-900'>
                      Location Matching
                    </h4>
                    <p className='text-sm text-gray-500'>Find people nearby</p>
                  </div>
                </div>

                <div className='flex items-center p-4 bg-gray-50 rounded-lg'>
                  <div className='flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-green-600'
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
                  </div>
                  <div className='ml-4'>
                    <h4 className='text-sm font-medium text-gray-900'>
                      Real-time Chat
                    </h4>
                    <p className='text-sm text-gray-500'>
                      Message your matches instantly
                    </p>
                  </div>
                </div>

                <div className='flex items-center p-4 bg-gray-50 rounded-lg'>
                  <div className='flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <svg
                      className='w-6 h-6 text-purple-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 10V3L4 14h7v7l9-11h-7z'
                      />
                    </svg>
                  </div>
                  <div className='ml-4'>
                    <h4 className='text-sm font-medium text-gray-900'>
                      Super Likes
                    </h4>
                    <p className='text-sm text-gray-500'>
                      Stand out from the crowd
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Development Progress */}
            <div className='bg-white rounded-xl shadow-sm p-6 border mt-6'>
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
                  <span className='bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                    🚧 Next
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Phase 3: Matching System
                  </span>
                  <span className='bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                    ⏳ Pending
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Phase 4: Real-time Chat
                  </span>
                  <span className='bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                    ⏳ Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
