import React, { useState, useEffect } from "react";
import axios from "axios";
import { useChat } from "../../context/ChatContext";

const ConversationsList = ({ onSelectConversation }) => {
  const {
    conversations,
    setConversations,
    currentConversation,
    isUserOnline,
    getTypingStatus,
  } = useChat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/chat/conversations`);

      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now - messageTime;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return messageTime.toLocaleDateString();
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return "";
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 text-center'>
        <p className='text-red-600 mb-4'>{error}</p>
        <button
          onClick={loadConversations}
          className='text-pink-600 hover:text-pink-700 font-medium'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className='text-center py-8 px-4'>
        <div className='mb-4'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400'
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
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          No conversations yet
        </h3>
        <p className='text-gray-600'>Start matching to begin conversations!</p>
      </div>
    );
  }

  return (
    <div className='h-full overflow-y-auto'>
      <div className='px-4 py-3 border-b border-gray-200'>
        <h2 className='text-lg font-semibold text-gray-900'>Messages</h2>
      </div>

      <div className='divide-y divide-gray-200'>
        {conversations.map((conversation) => {
          const isSelected =
            currentConversation?.matchId === conversation.matchId;
          const isOnline = isUserOnline(conversation.user._id);
          const typingStatus = getTypingStatus(conversation.matchId);

          return (
            <div
              key={conversation.matchId}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                isSelected ? "bg-pink-50 border-r-2 border-pink-500" : ""
              }`}
            >
              <div className='flex items-center space-x-3'>
                {/* Profile Photo */}
                <div className='relative flex-shrink-0'>
                  {conversation.user.primaryPhoto ? (
                    <img
                      src={conversation.user.primaryPhoto.url}
                      alt={conversation.user.firstName}
                      className='w-12 h-12 rounded-full object-cover'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center'>
                      <span className='text-white font-semibold'>
                        {conversation.user.firstName.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Online indicator */}
                  {isOnline && (
                    <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <h3 className='text-sm font-semibold text-gray-900 truncate'>
                      {conversation.user.firstName}
                    </h3>
                    {conversation.lastMessage && (
                      <span className='text-xs text-gray-500'>
                        {formatLastMessageTime(
                          conversation.lastMessage.createdAt
                        )}
                      </span>
                    )}
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      {typingStatus ? (
                        <p className='text-sm text-green-600 italic'>
                          {typingStatus} is typing...
                        </p>
                      ) : conversation.lastMessage ? (
                        <p className='text-sm text-gray-600 truncate'>
                          {conversation.lastMessage.isFromMe && "You: "}
                          {truncateMessage(conversation.lastMessage.content)}
                        </p>
                      ) : (
                        <p className='text-sm text-gray-500 italic'>
                          Say hello to start the conversation!
                        </p>
                      )}
                    </div>

                    {/* Unread count badge */}
                    {conversation.unreadCount > 0 && (
                      <div className='ml-2 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
                        {conversation.unreadCount > 9
                          ? "9+"
                          : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationsList;
