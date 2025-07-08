import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useMatchUrgency } from "../../hooks/useMatchUrgency";
import axios from "axios";

const MatchQueue = ({ onClose, onMatchSelect }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const { conversations } = useChat();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadMatchQueue();
  }, []);

  const loadMatchQueue = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/matching/queue`);

      if (response.data.success) {
        // Sort matches by priority: new matches first, then by urgency, then by match date
        const sortedMatches = response.data.matches.sort((a, b) => {
          const aHasConversation = hasConversation(a._id);
          const bHasConversation = hasConversation(b._id);

          // New matches (no conversation) come first
          if (!aHasConversation && bHasConversation) return -1;
          if (aHasConversation && !bHasConversation) return 1;

          // If both are new or both have conversations, sort by urgency
          const aUrgency = getUrgencyScore(a);
          const bUrgency = getUrgencyScore(b);
          if (aUrgency !== bUrgency) return bUrgency - aUrgency;

          // Finally, sort by match date (newest first)
          return new Date(b.matchedAt) - new Date(a.matchedAt);
        });

        setMatches(sortedMatches);
      }
    } catch (error) {
      console.error("Error loading match queue:", error);
      setError("Failed to load match queue");
    } finally {
      setLoading(false);
    }
  };

  const hasConversation = (matchId) => {
    const conversation = conversations.find((conv) => conv.matchId === matchId);
    return conversation && conversation.lastMessage;
  };

  const getUrgencyScore = (match) => {
    // Calculate urgency score based on match urgency level
    const urgencyLevels = {
      critical: 100,
      high: 80,
      medium: 60,
      low: 40,
      normal: 20,
    };
    return urgencyLevels[match.urgencyLevel] || 20;
  };

  const handleMatchSelect = (match) => {
    if (onMatchSelect) {
      onMatchSelect(match);
    } else {
      setSelectedMatch(match);
      setShowMatchDetails(true);
    }
  };

  const handleStartChat = (match) => {
    const conversation = conversations.find(
      (conv) => conv.matchId === match._id
    );

    if (conversation && conversation.lastMessage) {
      // Existing conversation - go directly to chat
      navigate("/chat");
    } else {
      // New match - show first message prompt
      navigate("/matches");
    }
  };

  const handleUnmatch = async (matchId) => {
    if (
      !window.confirm(
        "Are you sure you want to unmatch? This action cannot be undone and will delete all your messages."
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

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getMatchStatus = (match) => {
    const hasConversation = conversations.find(
      (conv) => conv.matchId === match._id
    );

    if (hasConversation && hasConversation.lastMessage) {
      return {
        type: "active",
        label: "Active Chat",
        color: "bg-green-100 text-green-800 border-green-200",
      };
    }

    if (match.urgencyLevel === "critical") {
      return {
        type: "critical",
        label: "Expiring Soon!",
        color: "bg-red-100 text-red-800 border-red-200 animate-pulse",
      };
    }

    if (match.urgencyLevel === "high") {
      return {
        type: "high",
        label: "New Match",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      };
    }

    return {
      type: "normal",
      label: "New Match",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    };
  };

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading your match queue...</p>
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
            <div className='text-red-500 text-6xl mb-4'>⚠️</div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>Oops!</h3>
            <p className='text-gray-600 mb-6'>{error}</p>
            <button
              onClick={() => {
                setError("");
                loadMatchQueue();
              }}
              className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors'
            >
              Try Again
            </button>
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
              <h2 className='text-xl font-semibold'>Match Queue</h2>
              <p className='text-sm opacity-90'>
                {matches.length} {matches.length === 1 ? "match" : "matches"} in
                your queue
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
          {matches.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 text-6xl mb-4'>💔</div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                No matches in queue
              </h3>
              <p className='text-gray-600 mb-6'>
                Start swiping to discover potential matches!
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
              >
                Start Discovering
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {matches.map((match, index) => {
                const status = getMatchStatus(match);
                const hasConversation = conversations.find(
                  (conv) => conv.matchId === match._id
                );

                return (
                  <div
                    key={match._id}
                    className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                      index === 0 ? "ring-2 ring-pink-200" : ""
                    }`}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div className='flex items-center space-x-4'>
                      {/* User Photo */}
                      <div className='relative'>
                        {match.user.primaryPhoto ? (
                          <img
                            src={match.user.primaryPhoto.url}
                            alt={match.user.firstName}
                            className='w-16 h-16 rounded-full object-cover border-2 border-pink-200'
                          />
                        ) : (
                          <div className='w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-red-400 border-2 border-pink-200 flex items-center justify-center'>
                            <span className='text-white text-xl font-bold'>
                              {match.user.firstName.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Queue Position Badge */}
                        <div className='absolute -top-2 -right-2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                          {index + 1}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-2'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {match.user.firstName}, {match.user.age}
                          </h3>
                          <span className='text-sm text-gray-500'>
                            {formatTimeAgo(match.matchedAt)}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className='mb-2'>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Profile Details */}
                        <div className='flex flex-wrap gap-1 mb-3'>
                          {match.user.occupation && (
                            <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                              💼 {match.user.occupation}
                            </span>
                          )}
                          {match.user.location && (
                            <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                              📍 {match.user.location}
                            </span>
                          )}
                          {match.user.interests &&
                            match.user.interests.length > 0 && (
                              <span className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full'>
                                🎯 {match.user.interests.slice(0, 2).join(", ")}
                              </span>
                            )}
                        </div>

                        {/* Last Message or Prompt */}
                        {hasConversation && hasConversation.lastMessage ? (
                          <p className='text-sm text-gray-700 line-clamp-2'>
                            {hasConversation.lastMessage.isFromMe && (
                              <span className='font-medium'>You: </span>
                            )}
                            {hasConversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className='text-sm text-pink-600 font-medium'>
                            💬 Send your first message!
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className='flex flex-col space-y-2'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(match);
                          }}
                          className='bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium'
                        >
                          {hasConversation && hasConversation.lastMessage
                            ? "Chat"
                            : "Message"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match._id);
                          }}
                          className='bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium'
                        >
                          Unmatch
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200'>
          <div className='flex justify-between items-center'>
            <button
              onClick={loadMatchQueue}
              className='text-pink-600 hover:text-pink-700 font-medium'
            >
              Refresh Queue
            </button>
            <button
              onClick={onClose}
              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'
            >
              Close
            </button>
          </div>
        </div>

        {/* Match Details Modal */}
        {showMatchDetails && selectedMatch && (
          <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
              <div className='p-4'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Match Details</h3>
                  <button
                    onClick={() => setShowMatchDetails(false)}
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

                {/* Match Info */}
                <div className='space-y-4'>
                  <div className='text-center'>
                    <img
                      src={
                        selectedMatch.user.primaryPhoto?.url ||
                        "/default-avatar.png"
                      }
                      alt={selectedMatch.user.firstName}
                      className='w-24 h-24 rounded-full object-cover mx-auto mb-3'
                    />
                    <h4 className='text-xl font-semibold'>
                      {selectedMatch.user.firstName}, {selectedMatch.user.age}
                    </h4>
                    <p className='text-gray-600'>
                      {selectedMatch.user.location}
                    </p>
                  </div>

                  {selectedMatch.user.bio && (
                    <div>
                      <h5 className='font-medium text-gray-900 mb-1'>About</h5>
                      <p className='text-gray-600 text-sm'>
                        {selectedMatch.user.bio}
                      </p>
                    </div>
                  )}

                  <div className='flex space-x-3'>
                    <button
                      onClick={() => {
                        setShowMatchDetails(false);
                        handleStartChat(selectedMatch);
                      }}
                      className='flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors'
                    >
                      Start Chat
                    </button>
                    <button
                      onClick={() => {
                        setShowMatchDetails(false);
                        handleUnmatch(selectedMatch._id);
                      }}
                      className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors'
                    >
                      Unmatch
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

export default MatchQueue;
