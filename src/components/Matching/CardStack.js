import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import UserCard from "./UserCard";
import MatchModal from "./MatchModal";
import MatchInsights from "./MatchInsights";
import IcebreakerSuggestions from "./IcebreakerSuggestions";
import emailService from "../../services/EmailService";
import notificationService from "../../services/NotificationService";
import { useChat } from "../../context/ChatContext";

const CardStack = () => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [swiping, setSwiping] = useState(false);
  const [match, setMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [selectedMatchForInsights, setSelectedMatchForInsights] =
    useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const { socket, isUserOnline, user } = useChat();

  // Load potential matches
  useEffect(() => {
    loadPotentialMatches();
    loadStats();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/matching/discover`);

      if (response.data.success) {
        setUsers(response.data.users);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Failed to load potential matches");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/matching/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error loading stats (non-critical):", error);
      // Set default stats if API fails
      setStats({
        swipes: {
          total: {
            likes: 0,
            passes: 0,
            superlikes: 0,
            total: 0,
          },
        },
        matches: {
          total: 0,
          conversations: 0,
          pending: 0,
          conversionRate: 0,
          messageRate: 0,
        },
        social: {
          likesReceived: 0,
          popularity: "New",
        },
      });
    }
  };

  const handleSwipe = async (action) => {
    if (swiping || currentIndex >= users.length) return;

    const currentUser = users[currentIndex];
    setSwiping(true);

    try {
      const response = await axios.post(`${API_URL}/matching/swipe`, {
        userId: currentUser._id,
        action,
      });

      if (response.data.success) {
        // Check if it's a match
        if (response.data.isMatch) {
          const matchData = response.data.match;

          // Enhanced match data structure with all new fields
          const enhancedMatchData = {
            ...matchData,
            // Ensure we have all the enhanced fields
            conversationStarters: matchData.conversationStarters || [],
            urgencyLevel: matchData.urgencyLevel || "normal",
            timeRemaining: matchData.timeRemaining || null,
            celebrationData: matchData.celebrationData || {
              showConfetti: true,
              animationType: "standard",
              soundEffect: "match_success",
            },
            // Enhanced profile data
            otherUser: {
              ...matchData.otherUser,
              // Ensure complete profile data is included
              photos: matchData.otherUser.photos || [],
              primaryPhoto:
                matchData.otherUser.primaryPhoto ||
                matchData.otherUser.photos?.[0],
              bio: matchData.otherUser.bio || "",
              age: matchData.otherUser.age || "",
              distance: matchData.otherUser.distance || null,
              interests: matchData.otherUser.interests || [],
              occupation: matchData.otherUser.occupation || "",
              education: matchData.otherUser.education || "",
              location: matchData.otherUser.location || "",
              // Add any other profile fields that might be useful
            },
          };

          setMatch(enhancedMatchData);
          setShowMatchModal(true);

          // Real-time socket notification if matched user is online
          if (
            socket &&
            isUserOnline &&
            enhancedMatchData.otherUser?._id &&
            isUserOnline(enhancedMatchData.otherUser._id)
          ) {
            socket.emit("new_match", enhancedMatchData);
          }

          // Send new match notifications (non-blocking)
          try {
            // Show local notification
            await notificationService.handleNewMatch(enhancedMatchData);

            // Send email notification
            const shouldSendEmail =
              await emailService.shouldSendNewMatchEmail();
            if (shouldSendEmail) {
              // Send email in background - don't wait for it
              emailService
                .sendNewMatchEmail(enhancedMatchData)
                .catch((error) => {
                  console.warn(
                    "Email notification failed (non-critical):",
                    error
                  );
                });
            }
          } catch (error) {
            console.warn("Failed to send match notifications:", error);
            // Continue with match flow even if notifications fail
          }
        }

        // Move to next card
        setCurrentIndex((prev) => prev + 1);

        // Load more users if running low
        if (currentIndex >= users.length - 2) {
          await loadPotentialMatches();
        }

        // Update stats
        await loadStats();
      }
    } catch (error) {
      console.error("Swipe error:", error);
      setError(error.response?.data?.message || "Error processing swipe");
    } finally {
      setSwiping(false);
    }
  };

  const handleLike = () => handleSwipe("like");
  const handlePass = () => handleSwipe("pass");
  const handleSuperLike = () => handleSwipe("superlike");

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatch(null);
  };

  const handleShowInsights = (matchData) => {
    setSelectedMatchForInsights(matchData);
    setShowInsights(true);
  };

  const handleShowIcebreakers = (matchData) => {
    setSelectedMatchForInsights(matchData);
    setShowIcebreakers(true);
  };

  const handleIcebreakerSelect = (message) => {
    // Handle icebreaker selection - could send message or store for later
    console.log("Selected icebreaker:", message);
    setShowIcebreakers(false);
  };

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Finding your perfect matches...</p>
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
            loadPotentialMatches();
          }}
          className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentUser) {
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
          No more potential matches
        </h3>
        <p className='text-gray-600 mb-6'>
          Check back later for new people to discover!
        </p>
        <button
          onClick={loadPotentialMatches}
          className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
        >
          Refresh Matches
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto'>
      {/* Stats Bar */}
      {stats && (
        <div className='bg-white rounded-lg shadow-sm border p-4 mb-6'>
          <div className='grid grid-cols-4 gap-4 text-center'>
            <div>
              <div className='text-lg font-bold text-pink-500'>
                {stats.swipes?.total?.likes || 0}
              </div>
              <div className='text-xs text-gray-500'>Likes</div>
            </div>
            <div>
              <div className='text-lg font-bold text-green-500'>
                {stats.matches?.total || 0}
              </div>
              <div className='text-xs text-gray-500'>Matches</div>
            </div>
            <div>
              <div className='text-lg font-bold text-blue-500'>
                {stats.swipes?.total?.superlikes || 0}
              </div>
              <div className='text-xs text-gray-500'>Super Likes</div>
            </div>
            <div>
              <div className='text-lg font-bold text-purple-500'>
                {stats.social?.likesReceived || 0}
              </div>
              <div className='text-xs text-gray-500'>Likes Received</div>
            </div>
          </div>
        </div>
      )}

      {/* Card Stack */}
      <div className='relative h-96 mb-6'>
        {/* Next card (behind current) */}
        {nextUser && (
          <div className='absolute inset-0 transform scale-95 opacity-50'>
            <UserCard user={nextUser} />
          </div>
        )}

        {/* Current card */}
        <div className='absolute inset-0 z-10'>
          <UserCard
            user={currentUser}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
            onSwipeUp={handleSuperLike}
            disabled={swiping}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-center space-x-4'>
        {/* Pass Button */}
        <button
          onClick={handlePass}
          disabled={swiping}
          className='w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
        >
          <svg
            className='w-6 h-6 text-gray-600'
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

        {/* Super Like Button */}
        <button onClick={handleSuperLike} disabled={swiping}>
          <svg
            className='w-6 h-6 text-blue-600'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
          </svg>
        </button>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={swiping}
          className='w-16 h-16 bg-white border-2 border-green-300 rounded-full flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
        >
          <svg
            className='w-6 h-6 text-green-600'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' />
          </svg>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className='mt-4 text-center text-sm text-gray-500'>
        {currentIndex + 1} of {users.length} potential matches
      </div>

      {/* Match Modal */}
      {showMatchModal && match && (
        <MatchModal match={match} onClose={closeMatchModal} />
      )}

      {/* Match Insights Modal */}
      {showInsights && selectedMatchForInsights && (
        <MatchInsights
          match={selectedMatchForInsights}
          onClose={() => {
            setShowInsights(false);
            setSelectedMatchForInsights(null);
          }}
        />
      )}

      {/* Icebreaker Suggestions Modal */}
      {showIcebreakers && selectedMatchForInsights && (
        <IcebreakerSuggestions
          match={selectedMatchForInsights}
          onSelect={handleIcebreakerSelect}
          onClose={() => {
            setShowIcebreakers(false);
            setSelectedMatchForInsights(null);
          }}
        />
      )}
    </div>
  );
};

export default CardStack;
