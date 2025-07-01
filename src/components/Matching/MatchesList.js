import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useChat } from "../../context/ChatContext";
import FirstMessagePrompt from "./FirstMessagePrompt";

const MatchesList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFirstMessagePrompt, setShowFirstMessagePrompt] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { setCurrentConversation, conversations } = useChat();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/matching/matches`);

      if (response.data.success) {
        // Sort matches to show newest first, then prioritize those without messages
        const sortedMatches = response.data.matches.sort((a, b) => {
          const aHasMessages = hasConversation(a._id);
          const bHasMessages = hasConversation(b._id);

          // If one has messages and other doesn't, prioritize the one without
          if (aHasMessages && !bHasMessages) return 1;
          if (!aHasMessages && bHasMessages) return -1;

          // Otherwise sort by match date (newest first)
          return new Date(b.matchedAt) - new Date(a.matchedAt);
        });

        setMatches(sortedMatches);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const hasConversation = (matchId) => {
    const conversation = conversations.find((conv) => conv.matchId === matchId);
    return conversation && conversation.lastMessage;
  };

  const handleStartChat = (match) => {
    const conversation = conversations.find(
      (conv) => conv.matchId === match._id
    );

    if (conversation && conversation.lastMessage) {
      // Existing conversation - go directly to chat
      setCurrentConversation(conversation);
      navigate("/chat");
    } else {
      // New match - show first message prompt
      setSelectedMatch(match);
      setShowFirstMessagePrompt(true);
    }
  };

  const handleFirstMessageSent = (messageContent) => {
    // Update the match to show it now has a conversation
    const conversation = {
      matchId: selectedMatch._id,
      user: selectedMatch.user,
      lastMessage: {
        content: messageContent,
        createdAt: new Date(),
        isFromMe: true,
      },
      unreadCount: 0,
      matchedAt: selectedMatch.matchedAt,
    };

    setCurrentConversation(conversation);
    navigate("/chat");

    // Reload matches to update the UI
    loadMatches();
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

  const getLastMessage = (matchId) => {
    const conversation = conversations.find((conv) => conv.matchId === matchId);
    return conversation?.lastMessage;
  };

  const getUnreadCount = (matchId) => {
    const conversation = conversations.find((conv) => conv.matchId === matchId);
    return conversation?.unreadCount || 0;
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

  const getMatchStatus = (match) => {
    const lastMessage = getLastMessage(match._id);
    const unreadCount = getUnreadCount(match._id);

    if (!lastMessage) {
      // Calculate how long since match
      const matchDate = new Date(match.matchedAt);
      const now = new Date();
      const diffHours = Math.floor((now - matchDate) / (1000 * 60 * 60));

      if (diffHours < 24) {
        return {
          type: "new",
          text: "New Match! Start the conversation",
          color: "bg-green-100 text-green-800 border-green-200",
        };
      } else if (diffHours < 72) {
        return {
          type: "pending",
          text: "Say hello before it expires!",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      } else {
        return {
          type: "expiring",
          text: "Match expires soon!",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      }
    } else if (unreadCount > 0) {
      return {
        type: "unread",
        text: `${unreadCount} new message${unreadCount > 1 ? "s" : ""}`,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    } else {
      return {
        type: "active",
        text: "Active conversation",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      };
    }
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
        <button
          onClick={() => (window.location.href = "#discover")}
          className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
        >
          Start Discovering
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Your Matches ({matches.length})
          </h2>
          <p className='text-gray-600 text-sm mt-1'>
            {matches.filter((m) => !getLastMessage(m._id)).length} new
            conversations to start
          </p>
        </div>
        <button
          onClick={loadMatches}
          className='text-pink-600 hover:text-pink-700 font-medium'
        >
          Refresh
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {matches.map((match) => {
          const lastMessage = getLastMessage(match._id);
          const unreadCount = getUnreadCount(match._id);
          const status = getMatchStatus(match);

          return (
            <div
              key={match._id}
              className='bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow relative'
            >
              {/* Status Badge */}
              <div
                className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${status.color} z-10`}
              >
                {status.text}
              </div>

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

                {/* Unread Messages Badge */}
                {unreadCount > 0 && (
                  <div className='absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center animate-pulse'>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}

                {/* Match Date Badge */}
                <div className='absolute bottom-3 right-3 bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded-full font-medium'>
                  {formatDate(match.matchedAt)}
                </div>
              </div>

              {/* User Info */}
              <div className='p-4'>
                <div className='flex justify-between items-start mb-2'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {match.user.firstName}, {match.user.age}
                  </h3>
                </div>

                {match.user.bio && (
                  <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                    {match.user.bio}
                  </p>
                )}

                {/* Last Message Preview */}
                {lastMessage ? (
                  <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                    <p className='text-sm text-gray-700 line-clamp-2'>
                      {lastMessage.isFromMe && (
                        <span className='font-medium'>You: </span>
                      )}
                      {lastMessage.content}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {formatDate(lastMessage.createdAt)}
                    </p>
                  </div>
                ) : (
                  <div className='bg-gradient-to-r from-pink-50 to-red-50 rounded-lg p-3 mb-3 border border-pink-200'>
                    <p className='text-sm text-pink-700 text-center'>
                      💬 Start your conversation with {match.user.firstName}!
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handleStartChat(match)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                      lastMessage
                        ? "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600"
                        : "bg-green-500 text-white hover:bg-green-600 animate-pulse"
                    }`}
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
                        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                      />
                    </svg>
                    {lastMessage ? "Continue Chat" : "Start Chat"}
                  </button>

                  <button
                    onClick={() => handleUnmatch(match._id)}
                    className='px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm'
                    title='Unmatch'
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
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>

                {/* Time since match for new matches */}
                {!lastMessage && (
                  <div className='mt-3 text-xs text-gray-500 text-center'>
                    Matched {formatDate(match.matchedAt)}
                    {(() => {
                      const matchDate = new Date(match.matchedAt);
                      const now = new Date();
                      const diffHours = Math.floor(
                        (now - matchDate) / (1000 * 60 * 60)
                      );

                      if (diffHours >= 48) {
                        return " • Expires in " + (72 - diffHours) + " hours";
                      }
                      return "";
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* First Message Prompt Modal */}
      {showFirstMessagePrompt && selectedMatch && (
        <FirstMessagePrompt
          match={selectedMatch}
          onMessageSent={handleFirstMessageSent}
          onClose={() => {
            setShowFirstMessagePrompt(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
};

export default MatchesList;
