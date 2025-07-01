import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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
  const maxReconnectAttempts = 5;

  // Clear any existing timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Event handlers with useCallback to prevent recreation
  const handleNewMessage = useCallback(
    (message) => {
      console.log("📧 New message received:", message);

      // Add to current conversation if it matches
      if (
        currentConversation &&
        message.matchId === currentConversation.matchId
      ) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            isFromMe: message.sender._id === user?._id,
          },
        ]);
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
    [currentConversation, user]
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
    if (data.isTyping) {
      setTypingUsers((prev) => ({ ...prev, [data.matchId]: data.userName }));
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.matchId];
          return updated;
        });
      }, 3000);
    } else {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[data.matchId];
        return updated;
      });
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

  // Enhanced connection handler
  const initializeSocket = useCallback(() => {
    if (!user || !token) {
      console.log("❌ Cannot initialize socket: No user or token");
      return;
    }

    console.log("🔄 Initializing socket connection to:", API_URL);
    setError(null);

    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ["polling", "websocket"],
      timeout: 20000,
      forceNew: true,
      reconnection: false, // We'll handle reconnection manually
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to chat server with ID:", newSocket.id);
      setConnected(true);
      setError(null);
      setReconnectAttempts(0);
      clearReconnectTimeout();
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from chat server:", reason);
      setConnected(false);

      // Only attempt reconnection for certain disconnect reasons
      if (reason === "io server disconnect" || reason === "transport close") {
        handleReconnection();
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("🚫 Socket connection error:", error.message);
      setConnected(false);
      setError(`Connection failed: ${error.message}`);
      handleReconnection();
    });

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

    newSocket.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
      setError(`Socket error: ${error.message || error}`);
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up socket connection...");
      clearReconnectTimeout();
      newSocket.off("new_message", handleNewMessage);
      newSocket.off("message_edited", handleMessageEdited);
      newSocket.off("message_deleted", handleMessageDeleted);
      newSocket.off("user_online", handleUserOnline);
      newSocket.off("user_offline", handleUserOffline);
      newSocket.off("user_typing", handleTypingIndicator);
      newSocket.off("messages_read", handleMessagesRead);
      newSocket.close();
    };
  }, [
    user,
    token,
    API_URL,
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleUserOnline,
    handleUserOffline,
    handleTypingIndicator,
    handleMessagesRead,
    clearReconnectTimeout,
  ]);

  // Handle reconnection with exponential backoff
  const handleReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      setError("Unable to connect to chat server. Please refresh the page.");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Max 10 seconds
    console.log(
      `🔄 Attempting reconnection in ${delay}ms (attempt ${
        reconnectAttempts + 1
      }/${maxReconnectAttempts})`
    );

    setReconnectAttempts((prev) => prev + 1);

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.close();
      }
      initializeSocket();
    }, delay);
  }, [reconnectAttempts, socket, initializeSocket, clearReconnectTimeout]);

  // Initialize socket when user/token changes
  useEffect(() => {
    if (user && token) {
      const cleanup = initializeSocket();
      return cleanup;
    } else {
      // Clean up if user logs out
      if (socket) {
        console.log("👋 User logged out, closing socket");
        socket.close();
        setSocket(null);
        setConnected(false);
        setError(null);
        clearReconnectTimeout();
      }
    }
  }, [user, token, initializeSocket, clearReconnectTimeout]);

  // Chat functions with error handling
  const joinConversation = useCallback(
    (matchId) => {
      if (socket && connected) {
        console.log("🏠 Joining conversation:", matchId);
        socket.emit("join_conversation", { matchId });
      } else {
        console.warn("⚠️ Cannot join conversation: Socket not connected");
      }
    },
    [socket, connected]
  );

  const leaveConversation = useCallback(
    (matchId) => {
      if (socket && connected) {
        console.log("🚪 Leaving conversation:", matchId);
        socket.emit("leave_conversation", { matchId });
      }
    },
    [socket, connected]
  );

  const sendMessage = useCallback(
    (matchId, content, messageType = "text") => {
      if (!socket || !connected) {
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
      socket.emit("send_message", {
        matchId,
        content: content.trim(),
        messageType,
      });
      return true;
    },
    [socket, connected]
  );

  const startTyping = useCallback(
    (matchId) => {
      if (socket && connected) {
        socket.emit("typing_start", { matchId });
      }
    },
    [socket, connected]
  );

  const stopTyping = useCallback(
    (matchId) => {
      if (socket && connected) {
        socket.emit("typing_stop", { matchId });
      }
    },
    [socket, connected]
  );

  const markMessagesAsRead = useCallback(
    (matchId) => {
      if (socket && connected) {
        socket.emit("mark_messages_read", { matchId });

        // Update local unread count
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
    [socket, connected, conversations]
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
    if (socket) {
      socket.close();
    }
    initializeSocket();
  }, [socket, initializeSocket]);

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
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
    clearReconnectTimeout();
  }, [clearReconnectTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  const value = {
    socket,
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
