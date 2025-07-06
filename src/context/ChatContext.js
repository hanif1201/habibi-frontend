import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutsRef = useRef(new Map());
  const socketRef = useRef(null);
  const isCleaningUpRef = useRef(false);
  const maxReconnectAttempts = 5;

  // Message deduplication set
  const processedMessagesRef = useRef(new Set());

  // Clear all timeouts function
  const clearAllTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear all typing timeouts
    typingTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    typingTimeoutsRef.current.clear();
  }, []);

  // Debounced message handler to prevent duplicates
  const addMessageWithDeduplication = useCallback(
    (message) => {
      const messageKey = `${message._id}-${message.createdAt}`;

      if (processedMessagesRef.current.has(messageKey)) {
        return; // Prevent duplicate
      }

      processedMessagesRef.current.add(messageKey);

      // Clean up old message keys (keep last 1000)
      if (processedMessagesRef.current.size > 1000) {
        const keysArray = Array.from(processedMessagesRef.current);
        const keysToRemove = keysArray.slice(0, 500);
        keysToRemove.forEach((key) => processedMessagesRef.current.delete(key));
      }

      setMessages((prev) => {
        // Double-check for duplicates in current state
        const exists = prev.find((m) => m._id === message._id);
        if (exists) return prev;

        return [
          ...prev,
          {
            ...message,
            isFromMe: message.sender._id === user?._id,
          },
        ];
      });
    },
    [user]
  );

  // Memoized event handlers to prevent recreation
  const handleNewMessage = useCallback(
    (message) => {
      console.log("📧 New message received:", message);

      // Add to current conversation if it matches
      if (
        currentConversation &&
        message.matchId === currentConversation.matchId
      ) {
        addMessageWithDeduplication(message);
      }

      // Update conversations list
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.matchId === message.matchId) {
            return {
              ...conv,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.sender._id,
                isFromMe: message.sender._id === user?._id,
              },
              unreadCount:
                message.sender._id === user?._id
                  ? conv.unreadCount
                  : conv.unreadCount + 1,
            };
          }
          return conv;
        });

        // Sort by last message time
        return updated.sort((a, b) => {
          const aTime = a.lastMessage
            ? new Date(a.lastMessage.createdAt)
            : new Date(a.matchedAt);
          const bTime = b.lastMessage
            ? new Date(b.lastMessage.createdAt)
            : new Date(b.matchedAt);
          return bTime - aTime;
        });
      });

      // Update unread count if message is not from current user
      if (message.sender._id !== user?._id) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [currentConversation, user, addMessageWithDeduplication]
  );

  const handleMessageEdited = useCallback(
    (data) => {
      if (currentConversation) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? {
                  ...msg,
                  content: data.content,
                  isEdited: true,
                  editedAt: data.editedAt,
                }
              : msg
          )
        );
      }
    },
    [currentConversation]
  );

  const handleMessageDeleted = useCallback(
    (data) => {
      if (currentConversation) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    },
    [currentConversation]
  );

  const handleUserOnline = useCallback((data) => {
    console.log("🟢 User online:", data.userId);
    setOnlineUsers((prev) => {
      const existing = prev.find((u) => u.user._id === data.userId);
      if (existing) return prev;
      return [...prev, { user: { _id: data.userId }, lastSeen: new Date() }];
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log("🔴 User offline:", data.userId);
    setOnlineUsers((prev) => prev.filter((u) => u.user._id !== data.userId));
  }, []);

  const handleTypingIndicator = useCallback((data) => {
    const { matchId, userId, userName, isTyping } = data;

    if (isTyping) {
      setTypingUsers((prev) => ({ ...prev, [matchId]: userName }));

      // Clear existing timeout for this match
      if (typingTimeoutsRef.current.has(matchId)) {
        clearTimeout(typingTimeoutsRef.current.get(matchId));
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[matchId];
          return updated;
        });
        typingTimeoutsRef.current.delete(matchId);
      }, 3000);

      typingTimeoutsRef.current.set(matchId, timeout);
    } else {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[matchId];
        return updated;
      });

      // Clear timeout
      if (typingTimeoutsRef.current.has(matchId)) {
        clearTimeout(typingTimeoutsRef.current.get(matchId));
        typingTimeoutsRef.current.delete(matchId);
      }
    }
  }, []);

  const handleMessagesRead = useCallback(
    (data) => {
      if (currentConversation && data.matchId === currentConversation.matchId) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            readAt: msg.readAt || (msg.isFromMe ? data.readAt : msg.readAt),
          }))
        );
      }
    },
    [currentConversation]
  );

  const handleError = useCallback((error) => {
    console.error("⚠️ Socket error:", error);
    setError(`Socket error: ${error.message || error}`);
  }, []);

  const handleDisconnect = useCallback((reason) => {
    console.log("❌ Disconnected from chat server:", reason);
    setConnected(false);

    // Only attempt reconnection for certain disconnect reasons and if not cleaning up
    if (
      !isCleaningUpRef.current &&
      (reason === "io server disconnect" || reason === "transport close")
    ) {
      handleReconnection();
    }
  }, []);

  const handleConnect = useCallback(() => {
    console.log("✅ Connected to chat server");
    setConnected(true);
    setError(null);
    setReconnectAttempts(0);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  const handleConnectError = useCallback((error) => {
    console.error("🚫 Socket connection error:", error.message);
    setConnected(false);
    setError(`Connection failed: ${error.message}`);
    if (!isCleaningUpRef.current) {
      handleReconnection();
    }
  }, []);

  // Handle reconnection with exponential backoff
  const handleReconnection = useCallback(() => {
    if (isCleaningUpRef.current || reconnectAttempts >= maxReconnectAttempts) {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log("❌ Max reconnection attempts reached");
        setError("Unable to connect to chat server. Please refresh the page.");
      }
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
    console.log(
      `🔄 Attempting reconnection in ${delay}ms (attempt ${
        reconnectAttempts + 1
      }/${maxReconnectAttempts})`
    );

    setReconnectAttempts((prev) => prev + 1);

    clearAllTimeouts();
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isCleaningUpRef.current) {
        initializeSocket();
      }
    }, delay);
  }, [reconnectAttempts, clearAllTimeouts]);

  // Socket cleanup function
  const cleanupSocket = useCallback(() => {
    isCleaningUpRef.current = true;

    if (socketRef.current) {
      console.log("🧹 Cleaning up socket connection...");

      // Remove all event listeners
      socketRef.current.removeAllListeners();
      socketRef.current.close();
      socketRef.current = null;
    }

    setSocket(null);
    setConnected(false);
    clearAllTimeouts();
    processedMessagesRef.current.clear();

    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, [clearAllTimeouts]);

  // Enhanced connection handler with proper cleanup
  const initializeSocket = useCallback(() => {
    if (!user || !token || isCleaningUpRef.current) {
      console.log("❌ Cannot initialize socket: No user/token or cleaning up");
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      cleanupSocket();
    }

    console.log("🔄 Initializing socket connection to:", API_URL);
    setError(null);

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      timeout: 20000,
      forceNew: true,
      reconnection: false, // We handle reconnection manually
    });

    socketRef.current = newSocket;

    // Attach event listeners
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("error", handleError);

    // Message events
    newSocket.on("new_message", handleNewMessage);
    newSocket.on("message_edited", handleMessageEdited);
    newSocket.on("message_deleted", handleMessageDeleted);
    newSocket.on("user_online", handleUserOnline);
    newSocket.on("user_offline", handleUserOffline);
    newSocket.on("user_typing", handleTypingIndicator);
    newSocket.on("messages_read", handleMessagesRead);

    newSocket.on("online_users", (users) => {
      console.log("👥 Online users updated:", users?.length || 0);
      setOnlineUsers(users || []);
    });

    setSocket(newSocket);
  }, [
    user,
    token,
    API_URL,
    cleanupSocket,
    handleConnect,
    handleDisconnect,
    handleConnectError,
    handleError,
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleUserOnline,
    handleUserOffline,
    handleTypingIndicator,
    handleMessagesRead,
  ]);

  // Initialize socket when user/token changes
  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      cleanupSocket();
      resetChatState();
    }

    // Cleanup on unmount
    return () => {
      cleanupSocket();
    };
  }, [user, token, initializeSocket, cleanupSocket]);

  // Chat functions with error handling and optimistic updates
  const joinConversation = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        console.log("🏠 Joining conversation:", matchId);
        socketRef.current.emit("join_conversation", { matchId });
      } else {
        console.warn("⚠️ Cannot join conversation: Socket not connected");
      }
    },
    [connected]
  );

  const leaveConversation = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        console.log("🚪 Leaving conversation:", matchId);
        socketRef.current.emit("leave_conversation", { matchId });
      }
    },
    [connected]
  );

  const sendMessage = useCallback(
    (matchId, content, messageType = "text") => {
      if (!socketRef.current || !connected) {
        console.warn("⚠️ Cannot send message: Socket not connected");
        setError("Not connected to chat server");
        return false;
      }

      if (!content.trim()) {
        console.warn("⚠️ Cannot send empty message");
        return false;
      }

      console.log("📤 Sending message:", {
        matchId,
        content: content.substring(0, 50) + "...",
      });

      // Optimistic update
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: content.trim(),
        sender: { _id: user._id, firstName: user.firstName },
        isFromMe: true,
        createdAt: new Date(),
        messageType,
        isOptimistic: true,
      };

      if (currentConversation && matchId === currentConversation.matchId) {
        setMessages((prev) => [...prev, tempMessage]);
      }

      socketRef.current.emit("send_message", {
        matchId,
        content: content.trim(),
        messageType,
        tempId: tempMessage._id,
      });

      return true;
    },
    [connected, user, currentConversation]
  );

  const startTyping = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        socketRef.current.emit("typing_start", { matchId });
      }
    },
    [connected]
  );

  const stopTyping = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        socketRef.current.emit("typing_stop", { matchId });
      }
    },
    [connected]
  );

  const markMessagesAsRead = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        socketRef.current.emit("mark_messages_read", { matchId });

        // Optimistic update
        setConversations((prev) =>
          prev.map((conv) =>
            conv.matchId === matchId ? { ...conv, unreadCount: 0 } : conv
          )
        );

        // Recalculate total unread count
        setUnreadCount((prev) => {
          const conversation = conversations.find((c) => c.matchId === matchId);
          return Math.max(0, prev - (conversation?.unreadCount || 0));
        });
      }
    },
    [connected, conversations]
  );

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.some((u) => u.user._id === userId);
    },
    [onlineUsers]
  );

  const getTypingStatus = useCallback(
    (matchId) => {
      return typingUsers[matchId] || null;
    },
    [typingUsers]
  );

  // Manual reconnection function
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
    clearAllTimeouts();
    initializeSocket();
  }, [initializeSocket, clearAllTimeouts]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    processedMessagesRef.current.clear();
  }, []);

  // Reset all chat state (useful for logout)
  const resetChatState = useCallback(() => {
    setOnlineUsers([]);
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    setUnreadCount(0);
    setTypingUsers({});
    setConnected(false);
    setError(null);
    setReconnectAttempts(0);
    clearAllTimeouts();
    processedMessagesRef.current.clear();
  }, [clearAllTimeouts]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      error,
      reconnectAttempts,
      conversations,
      setConversations,
      currentConversation,
      setCurrentConversation,
      messages,
      setMessages,
      unreadCount,
      setUnreadCount,
      onlineUsers,
      typingUsers,

      // Functions
      joinConversation,
      leaveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      markMessagesAsRead,
      isUserOnline,
      getTypingStatus,
      clearCurrentConversation,
      resetChatState,
      reconnect,
    }),
    [
      connected,
      error,
      reconnectAttempts,
      conversations,
      currentConversation,
      messages,
      unreadCount,
      onlineUsers,
      typingUsers,
      joinConversation,
      leaveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      markMessagesAsRead,
      isUserOnline,
      getTypingStatus,
      clearCurrentConversation,
      resetChatState,
      reconnect,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
