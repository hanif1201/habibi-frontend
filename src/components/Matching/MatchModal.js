import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const MatchModal = ({ match, onClose }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!match) return null;

  const otherUser = match.otherUser;
  const currentUserPhoto =
    user?.photos?.find((photo) => photo.isPrimary) || user?.photos?.[0];
  const otherUserPhoto =
    otherUser?.photos?.find((photo) => photo.isPrimary) ||
    otherUser?.photos?.[0];

  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
        showModal ? "bg-opacity-75" : "bg-opacity-0"
      }`}
    >
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div
          className={`bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-2xl shadow-2xl max-w-md w-full p-8 text-white text-center transform transition-all duration-300 ${
            showModal ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {/* Match Animation */}
          <div className='relative mb-8'>
            {/* Celebration Effects */}
            <div className='absolute inset-0 flex items-center justify-center'>
              {/* Animated hearts */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute text-2xl animate-bounce`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `rotate(${i * 60}deg) translateY(-40px)`,
                  }}
                >
                  💖
                </div>
              ))}
            </div>

            {/* User Photos */}
            <div className='flex justify-center items-center space-x-4 relative z-10'>
              {/* Current User Photo */}
              <div className='relative'>
                {currentUserPhoto ? (
                  <img
                    src={currentUserPhoto.url}
                    alt='You'
                    className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg'
                  />
                ) : (
                  <div className='w-20 h-20 rounded-full bg-white bg-opacity-30 border-4 border-white shadow-lg flex items-center justify-center'>
                    <span className='text-2xl font-bold'>
                      {user?.firstName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Heart Icon */}
              <div className='text-4xl animate-pulse'>❤️</div>

              {/* Other User Photo */}
              <div className='relative'>
                {otherUserPhoto ? (
                  <img
                    src={otherUserPhoto.url}
                    alt={otherUser.firstName}
                    className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg'
                  />
                ) : (
                  <div className='w-20 h-20 rounded-full bg-white bg-opacity-30 border-4 border-white shadow-lg flex items-center justify-center'>
                    <span className='text-2xl font-bold'>
                      {otherUser?.firstName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Text */}
          <div className='mb-6'>
            <h2 className='text-3xl font-bold mb-2 animate-pulse'>
              It's a Match! 🎉
            </h2>
            <p className='text-lg opacity-90'>
              You and {otherUser.firstName} liked each other
            </p>
          </div>

          {/* Other User Info */}
          <div className='bg-white bg-opacity-20 rounded-xl p-4 mb-6'>
            <h3 className='text-xl font-semibold mb-1'>
              {otherUser.firstName}, {otherUser.age}
            </h3>
            {otherUser.bio && (
              <p className='text-sm opacity-90 line-clamp-2'>{otherUser.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <button
              onClick={handleClose}
              className='w-full bg-white text-pink-600 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors duration-200 shadow-lg'
            >
              Start Chatting
            </button>

            <button
              onClick={handleClose}
              className='w-full bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-xl hover:bg-white hover:text-pink-600 transition-all duration-200'
            >
              Keep Swiping
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className='absolute top-4 right-4 text-white hover:text-gray-200 transition-colors'
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

          {/* Confetti Animation */}
          <div className='absolute inset-0 pointer-events-none overflow-hidden rounded-2xl'>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className='absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping'
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
