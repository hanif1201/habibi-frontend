import React, { useState, useEffect } from "react";
import axios from "axios";

const MatchesList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/matching/matches`);

      if (response.data.success) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId) => {
    if (
      !window.confirm(
        "Are you sure you want to unmatch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/matching/matches/${matchId}`
      );

      if (response.data.success) {
        setMatches(matches.filter((match) => match._id !== matchId));
      }
    } catch (error) {
      console.error("Error unmatching:", error);
      setError("Failed to unmatch");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <p className='text-red-700 mb-4'>{error}</p>
        <button
          onClick={() => {
            setError("");
            loadMatches();
          }}
          className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
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
              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
            />
          </svg>
        </div>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
          No matches yet
        </h3>
        <p className='text-gray-600 mb-6'>
          Start swiping to find your perfect match!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>
          Your Matches ({matches.length})
        </h2>
        <button
          onClick={loadMatches}
          className='text-pink-600 hover:text-pink-700 font-medium'
        >
          Refresh
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {matches.map((match) => (
          <div
            key={match._id}
            className='bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow'
          >
            {/* User Photo */}
            <div className='relative'>
              {match.user.primaryPhoto ? (
                <img
                  src={match.user.primaryPhoto.url}
                  alt={match.user.firstName}
                  className='w-full h-48 object-cover rounded-t-xl'
                />
              ) : (
                <div className='w-full h-48 bg-gradient-to-br from-pink-500 to-red-500 rounded-t-xl flex items-center justify-center'>
                  <span className='text-4xl font-bold text-white'>
                    {match.user.firstName.charAt(0)}
                  </span>
                </div>
              )}

              {/* Match Date Badge */}
              <div className='absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
                Matched {formatDate(match.matchedAt)}
              </div>
            </div>

            {/* User Info */}
            <div className='p-4'>
              <div className='flex justify-between items-start mb-2'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {match.user.firstName}, {match.user.age}
                </h3>
                <button
                  onClick={() => handleUnmatch(match._id)}
                  className='text-gray-400 hover:text-red-500 transition-colors'
                  title='Unmatch'
                >
                  <svg
                    className='w-5 h-5'
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

              {match.user.bio && (
                <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                  {match.user.bio}
                </p>
              )}

              {/* Action Buttons */}
              <div className='flex space-x-2'>
                <button className='flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 text-sm font-medium'>
                  Send Message
                </button>
                <button className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                  <svg
                    className='w-4 h-4 text-gray-600'
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
                </button>
              </div>

              {/* Last Activity */}
              <div className='mt-3 text-xs text-gray-500 text-center'>
                Last activity: {formatDate(match.lastActivity)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchesList;
