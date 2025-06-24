import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const ChatInterface = ({ conversation }) => {
  const { user } = useAuth();
  const {
    messages,
    setMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    joinConversation,
    leaveConversation,
    isUserOnline,
    getTypingStatus,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      loadMessages();
      joinConversation(conversation.matchId);
      markMessagesAsRead(conversation.matchId);

      return () => {
        leaveConversation(conversation.matchId);
      };
    }
  }, [conversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  const loadMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/chat/${conversation.matchId}/messages`,
        {
          params: { page: pageNum, limit: 50 },
        }
      );

      if (response.data.success) {
        if (pageNum === 1) {
          setMessages(response.data.messages);
        } else {
          setMessages((prev) => [...response.data.messages, ...prev]);
        }
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Send via socket for real-time
      sendMessage(conversation.matchId, messageContent);

      // Also send via HTTP as fallback
      await axios.post(`${API_URL}/chat/${conversation.matchId}/messages`, {
        content: messageContent,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Start typing indicator
    startTyping(conversation.matchId);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversation.matchId);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
      loadMessages(page + 1);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return (
        "Yesterday " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffInDays < 7) {
      return (
        date.toLocaleDateString([], { weekday: "short" }) +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!conversation) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <svg
            className='mx-auto h-16 w-16 text-gray-400 mb-4'
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
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Select a conversation
          </h3>
          <p className='text-gray-600'>Choose a match to start chatting</p>
        </div>
      </div>
    );
  }

  const isOnline = isUserOnline(conversation.user._id);
  const typingStatus = getTypingStatus(conversation.matchId);

  return (
    <div className='flex-1 flex flex-col h-full'>
      {/* Chat Header */}
      <div className='bg-white border-b border-gray-200 p-4'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            {conversation.user.primaryPhoto ? (
              <img
                src={conversation.user.primaryPhoto.url}
                alt={conversation.user.firstName}
                className='w-10 h-10 rounded-full object-cover'
              />
            ) : (
              <div className='w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center'>
                <span className='text-white font-semibold text-sm'>
                  {conversation.user.firstName.charAt(0)}
                </span>
              </div>
            )}
            {isOnline && (
              <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
            )}
          </div>

          <div>
            <h3 className='font-semibold text-gray-900'>
              {conversation.user.firstName}
            </h3>
            <p className='text-sm text-gray-500'>
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className='flex-1 overflow-y-auto p-4 space-y-4'
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMore && !loading) {
            loadMoreMessages();
          }
        }}
      >
        {/* Load More Button */}
        {hasMore && (
          <div className='text-center'>
            <button
              onClick={loadMoreMessages}
              disabled={loading}
              className='text-pink-600 hover:text-pink-700 text-sm font-medium disabled:opacity-50'
            >
              {loading ? "Loading..." : "Load more messages"}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isFromMe = message.isFromMe;
          const showTime =
            index === 0 ||
            new Date(message.createdAt) -
              new Date(messages[index - 1].createdAt) >
              300000; // 5 minutes

          return (
            <div key={message._id}>
              {/* Time separator */}
              {showTime && (
                <div className='text-center text-xs text-gray-500 my-4'>
                  {formatMessageTime(message.createdAt)}
                </div>
              )}

              {/* Message */}
              <div
                className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isFromMe
                      ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p className='text-sm'>{message.content}</p>

                  {/* Message status */}
                  <div
                    className={`text-xs mt-1 ${
                      isFromMe ? "text-pink-100" : "text-gray-500"
                    }`}
                  >
                    {isFromMe && <span>{message.readAt ? "✓✓" : "✓"}</span>}
                    {message.isEdited && <span className='ml-1'>(edited)</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingStatus && (
          <div className='flex justify-start'>
            <div className='bg-gray-200 text-gray-900 px-4 py-2 rounded-lg'>
              <div className='flex items-center space-x-1'>
                <span className='text-sm'>{typingStatus} is typing</span>
                <div className='flex space-x-1'>
                  <div className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'></div>
                  <div
                    className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className='bg-white border-t border-gray-200 p-4'>
        <form
          onSubmit={handleSendMessage}
          className='flex items-center space-x-3'
        >
          <div className='flex-1'>
            <input
              ref={inputRef}
              type='text'
              value={newMessage}
              onChange={handleTyping}
              placeholder='Type a message...'
              className='w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              maxLength={1000}
              disabled={sending}
            />
          </div>

          <button
            type='submit'
            disabled={!newMessage.trim() || sending}
            className='bg-gradient-to-r from-pink-500 to-red-500 text-white p-2 rounded-full hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
          >
            {sending ? (
              <svg
                className='w-5 h-5 animate-spin'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
            ) : (
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
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
