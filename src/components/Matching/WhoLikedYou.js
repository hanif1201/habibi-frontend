import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const WhoLikedYou = ({ onClose, onMatch }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadWhoLikedYou();
  }, []);

  const loadWhoLikedYou = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/matching/who-liked-you`);

      if (response.data.success) {
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error("Error loading who liked you:", error);
      if (error.response?.status === 403) {
        setError("This feature is only available for premium users");
      } else {
        setError("Failed to load likes");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/matching/swipe`, {
        userId,
        action: "like",
      });

      if (response.data.success && response.data.isMatch) {
        // It's a match!
        onMatch(response.data.match);
        setLikes(likes.filter((like) => like.user._id !== userId));
      } else {
        // Just a like, remove from the list
        setLikes(likes.filter((like) => like.user._id !== userId));
      }
    } catch (error) {
      console.error("Error liking user:", error);
      setError("Failed to like user");
    }
  };

  const handlePass = async (userId) => {
    try {
      await axios.post(`${API_URL}/matching/swipe`, {
        userId,
        action: "pass",
      });

      // Remove from the list
      setLikes(likes.filter((like) => like.user._id !== userId));
    } catch (error) {
      console.error("Error passing user:", error);
      setError("Failed to pass user");
    }
  };

  const handleViewProfile = (userData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading who liked you...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='text-red-500 text-6xl mb-4'>💔</div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              {error.includes("premium") ? "Premium Feature" : "Oops!"}
            </h3>
            <p className='text-gray-600 mb-6'>
              {error.includes("premium")
                ? "Upgrade to premium to see who liked you!"
                : error}
            </p>
            <div className='space-y-3'>
              <button
                onClick={onClose}
                className='w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'
              >
                Close
              </button>
              {error.includes("premium") && (
                <button
                  onClick={() => navigate("/premium")}
                  className='w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-pink-500 to-red-500 p-4 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>Who Liked You</h2>
              <p className='text-sm opacity-90'>
                {likes.length} {likes.length === 1 ? "person" : "people"} liked
                you
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:text-gray-200 transition-colors'
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
        </div>

        {/* Content */}
        <div className='p-4 max-h-[calc(90vh-80px)] overflow-y-auto'>
          {likes.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-6xl mb-4'>💔</div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                No likes yet
              </h3>
              <p className='text-gray-600 mb-6'>
                Keep swiping and someone will like you soon!
              </p>
              <button
                onClick={onClose}
                className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
              >
                Keep Swiping
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {likes.map((like) => (
                <div
                  key={like._id}
                  className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                >
                  <div className='flex items-center space-x-4'>
                    {/* User Photo */}
                    <div className='relative'>
                      {like.user.primaryPhoto ? (
                        <img
                          src={like.user.primaryPhoto.url}
                          alt={like.user.firstName}
                          className='w-16 h-16 rounded-full object-cover border-2 border-pink-200'
                        />
                      ) : (
                        <div className='w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-red-400 border-2 border-pink-200 flex items-center justify-center'>
                          <span className='text-white text-xl font-bold'>
                            {like.user.firstName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className='absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center'>
                        <span className='text-white text-xs'>❤️</span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {like.user.firstName}, {like.user.age}
                        </h3>
                        <span className='text-sm text-gray-500'>
                          {formatTimeAgo(like.likedAt)}
                        </span>
                      </div>

                      {/* Profile Details */}
                      <div className='flex flex-wrap gap-1 mb-3'>
                        {like.user.occupation && (
                          <span className='px-2 py-1 bg-white text-gray-700 text-xs rounded-full border'>
                            💼 {like.user.occupation}
                          </span>
                        )}
                        {like.user.location && (
                          <span className='px-2 py-1 bg-white text-gray-700 text-xs rounded-full border'>
                            📍 {like.user.location}
                          </span>
                        )}
                        {like.user.interests &&
                          like.user.interests.length > 0 && (
                            <span className='px-2 py-1 bg-white text-gray-700 text-xs rounded-full border'>
                              🎯 {like.user.interests.slice(0, 2).join(", ")}
                            </span>
                          )}
                      </div>

                      {/* Bio Preview */}
                      {like.user.bio && (
                        <p className='text-sm text-gray-600 line-clamp-2 mb-3'>
                          {like.user.bio}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className='flex space-x-3'>
                        <button
                          onClick={() => handleViewProfile(like.user)}
                          className='flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium'
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handlePass(like.user._id)}
                          className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium'
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleLike(like.user._id)}
                          className='bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium'
                        >
                          Like Back
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Modal */}
        {showUserModal && selectedUser && (
          <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
              <div className='p-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Profile</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className='text-gray-500 hover:text-gray-700'
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

                {/* User Photos */}
                <div className='mb-4'>
                  {selectedUser.photos && selectedUser.photos.length > 0 ? (
                    <img
                      src={
                        selectedUser.primaryPhoto?.url ||
                        selectedUser.photos[0].url
                      }
                      alt={selectedUser.firstName}
                      className='w-full h-64 object-cover rounded-lg'
                    />
                  ) : (
                    <div className='w-full h-64 bg-gradient-to-r from-pink-400 to-red-400 rounded-lg flex items-center justify-center'>
                      <span className='text-white text-4xl font-bold'>
                        {selectedUser.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className='space-y-3'>
                  <div>
                    <h4 className='text-xl font-semibold text-gray-900'>
                      {selectedUser.firstName}, {selectedUser.age}
                    </h4>
                    {selectedUser.location && (
                      <p className='text-gray-600'>
                        📍 {selectedUser.location}
                      </p>
                    )}
                  </div>

                  {selectedUser.bio && (
                    <div>
                      <h5 className='font-medium text-gray-900 mb-1'>About</h5>
                      <p className='text-gray-600'>{selectedUser.bio}</p>
                    </div>
                  )}

                  {selectedUser.interests &&
                    selectedUser.interests.length > 0 && (
                      <div>
                        <h5 className='font-medium text-gray-900 mb-1'>
                          Interests
                        </h5>
                        <div className='flex flex-wrap gap-2'>
                          {selectedUser.interests.map((interest, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm'
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className='flex space-x-3 pt-4'>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        handlePass(selectedUser._id);
                      }}
                      className='flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors'
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        handleLike(selectedUser._id);
                      }}
                      className='flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors'
                    >
                      Like Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhoLikedYou;
