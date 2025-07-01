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
    connected,
    error: chatError,
    reconnect,
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const maxRetries = 3;

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setError("");
      loadMessages(1);
      joinConversation(conversation.matchId);
      markMessagesAsRead(conversation.matchId);

      return () => {
        leaveConversation(conversation.matchId);
      };
    }
  }, [
    conversation,
    joinConversation,
    leaveConversation,
    markMessagesAsRead,
    setMessages,
  ]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation && inputRef.current && connected) {
      inputRef.current.focus();
    }
  }, [conversation, connected]);

  const loadMessages = async (pageNum = 1, retryAttempt = 0) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/chat/${conversation.matchId}/messages`,
        {
          params: { page: pageNum, limit: 50 },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.success) {
        if (pageNum === 1) {
          setMessages(response.data.messages);
        } else {
          setMessages((prev) => [...response.data.messages, ...prev]);
        }
        setHasMore(response.data.hasMore);
        setRetryCount(0);
      }
    } catch (error) {
      console.error("Error loading messages:", error);

      if (retryAttempt < maxRetries) {
        console.log(
          `Retrying message load (${retryAttempt + 1}/${maxRetries})`
        );
        setTimeout(() => {
          loadMessages(pageNum, retryAttempt + 1);
        }, 1000 * (retryAttempt + 1));
      } else {
        setError("Failed to load messages. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending || !connected) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    setError("");

    try {
      // Send via socket for real-time
      const success = sendMessage(conversation.matchId, messageContent);

      if (!success) {
        throw new Error("Failed to send message via socket");
      }

      // Also send via HTTP as fallback
      try {
        await axios.post(`${API_URL}/chat/${conversation.matchId}/messages`, {
          content: messageContent,
        });
      } catch (httpError) {
        console.warn(
          "HTTP message send failed (socket may have succeeded):",
          httpError
        );
      }

      setRetryCount(0);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      setNewMessage(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!connected) return;

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

  const retryConnection = () => {
    setError("");
    setRetryCount((prev) => prev + 1);
    reconnect();
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
      {/* Connection Status Banner */}
      {!connected && (
        <div className='bg-yellow-100 border-b border-yellow-200 px-4 py-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <svg
                className='w-4 h-4 text-yellow-600 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <span className='text-yellow-800 text-sm font-medium'>
                {chatError || "Reconnecting to chat..."}
              </span>
            </div>
            <button
              onClick={retryConnection}
              className='text-yellow-800 hover:text-yellow-900 text-sm font-medium underline'
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className='bg-red-100 border-b border-red-200 px-4 py-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <svg
                className='w-4 h-4 text-red-600 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='text-red-800 text-sm font-medium'>{error}</span>
            </div>
            <button
              onClick={() => {
                setError("");
                loadMessages(1);
              }}
              className='text-red-800 hover:text-red-900 text-sm font-medium underline'
            >
              Retry
            </button>
          </div>
        </div>
      )}

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
              className='text-pink-600 hover:text-pink-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className='flex items-center justify-center'>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-4 w-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Loading...
                </div>
              ) : (
                "Load more messages"
              )}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 && !loading ? (
          <div className='text-center py-8'>
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
              Start the conversation!
            </h3>
            <p className='text-gray-600'>
              Say hello to {conversation.user.firstName} and break the ice!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
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
                  className={`flex ${
                    isFromMe ? "justify-end" : "justify-start"
                  }`}
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
                      {message.isEdited && (
                        <span className='ml-1'>(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

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
              placeholder={
                connected ? "Type a message..." : "Connecting to chat..."
              }
              className='w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500'
              maxLength={1000}
              disabled={sending || !connected}
            />
          </div>

          <button
            type='submit'
            disabled={!newMessage.trim() || sending || !connected}
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

        {/* Connection status indicator */}
        {!connected && (
          <div className='mt-2 text-center'>
            <span className='text-xs text-gray-500'>
              Reconnecting to chat... (
              {retryCount > 0 ? `Attempt ${retryCount}` : "Connecting"})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
