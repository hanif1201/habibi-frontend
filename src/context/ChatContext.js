// src/context/ChatContext.js - ENHANCED FIXED VERSION

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
  const { user, token, isAuthenticated } = useAuth();

  // Core state
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // User state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const typingTimeoutsRef = useRef(new Map());
  const connectionAttemptRef = useRef(false);

  // Constants
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_BASE = 1000;
  const MAX_RECONNECT_DELAY = 30000;

  // Enhanced cleanup function
  const cleanupSocket = useCallback(() => {
    console.log("🧹 Cleaning up socket connection...");

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    typingTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    typingTimeoutsRef.current.clear();

    // Cleanup socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset state
    setSocket(null);
    setConnected(false);
    setOnlineUsers([]);
    setTypingUsers({});
    connectionAttemptRef.current = false;
  }, []);

  // Enhanced error handling
  const handleSocketError = useCallback((error, context = "unknown") => {
    console.error(`❌ Socket error in ${context}:`, error);

    let errorMessage = "Connection error";
    let shouldReconnect = true;

    if (error.message) {
      if (error.message.includes("Authentication failed")) {
        errorMessage = "Authentication failed. Please login again.";
        shouldReconnect = false;
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network connection failed";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timeout";
      } else {
        errorMessage = error.message;
      }
    }

    setError(errorMessage);
    setConnected(false);

    if (shouldReconnect) {
      handleReconnection();
    }
  }, []);

  // Calculate reconnection delay with exponential backoff
  const getReconnectDelay = useCallback((attemptNumber) => {
    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(2, attemptNumber),
      MAX_RECONNECT_DELAY
    );
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  // Enhanced reconnection logic
  const handleReconnection = useCallback(() => {
    if (!isAuthenticated || !user || !token) {
      console.log("❌ Cannot reconnect: No authentication");
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("❌ Max reconnection attempts reached");
      setError("Unable to connect to chat server. Please refresh the page.");
      return;
    }

    if (connectionAttemptRef.current) {
      console.log("🔄 Connection attempt already in progress");
      return;
    }

    const delay = getReconnectDelay(reconnectAttempts);
    console.log(
      `🔄 Attempting reconnection in ${Math.round(delay)}ms (attempt ${
        reconnectAttempts + 1
      }/${MAX_RECONNECT_ATTEMPTS})`
    );

    setReconnectAttempts((prev) => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      initializeSocket();
    }, delay);
  }, [isAuthenticated, user, token, reconnectAttempts, getReconnectDelay]);

  // Socket event handlers
  const handleConnect = useCallback(() => {
    console.log("✅ Connected to chat server");
    setConnected(true);
    setError(null);
    setReconnectAttempts(0);
    connectionAttemptRef.current = false;

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleDisconnect = useCallback(
    (reason) => {
      console.log("❌ Disconnected from chat server:", reason);
      setConnected(false);
      connectionAttemptRef.current = false;

      // Only attempt reconnection for unexpected disconnects
      if (reason !== "io client disconnect" && isAuthenticated) {
        handleReconnection();
      }
    },
    [isAuthenticated, handleReconnection]
  );

  const handleConnectError = useCallback(
    (error) => {
      console.error("🚫 Socket connection error:", error);
      connectionAttemptRef.current = false;
      handleSocketError(error, "connection");
    },
    [handleSocketError]
  );

  // Message handlers
  const handleNewMessage = useCallback(
    (message) => {
      console.log("📧 New message received:", message);

      try {
        // Update messages if in current conversation
        if (
          currentConversation &&
          message.matchId === currentConversation.matchId
        ) {
          setMessages((prev) => {
            // Prevent duplicate messages
            const exists = prev.some((msg) => msg._id === message._id);
            if (exists) return prev;

            return [
              ...prev,
              {
                ...message,
                isFromMe: message.sender._id === user?._id,
              },
            ];
          });
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

        // Update unread count
        if (message.sender._id !== user?._id) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error handling new message:", error);
      }
    },
    [currentConversation, user]
  );

  const handleUserOnline = useCallback((data) => {
    console.log("🟢 User online:", data.userId);
    setOnlineUsers((prev) => {
      const existing = prev.find((u) => u.user?._id === data.userId);
      if (existing) return prev;

      return [
        ...prev,
        {
          user: { _id: data.userId },
          lastSeen: new Date(),
          connectedAt: new Date(),
        },
      ];
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log("🔴 User offline:", data.userId);
    setOnlineUsers((prev) => prev.filter((u) => u.user?._id !== data.userId));
  }, []);

  const handleTypingIndicator = useCallback((data) => {
    const { matchId, userId, userName, isTyping } = data;

    if (isTyping) {
      setTypingUsers((prev) => ({ ...prev, [matchId]: userName }));

      // Clear existing timeout
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

  // Handle new match notification
  const handleNewMatch = useCallback((matchData) => {
    console.log("💖 New match received via socket:", matchData);

    // Update conversations list with new match
    setConversations((prev) => {
      const newConversation = {
        matchId: matchData._id,
        user: matchData.otherUser,
        matchedAt: matchData.createdAt,
        lastMessage: null,
        unreadCount: 0,
      };

      // Check if conversation already exists
      const exists = prev.some((conv) => conv.matchId === matchData._id);
      if (exists) return prev;

      // Add to beginning of list
      return [newConversation, ...prev];
    });

    // Show match notification
    if (Notification.permission === "granted") {
      new Notification("💖 New Match!", {
        body: `You and ${matchData.otherUser.firstName} liked each other!`,
        icon: "/logo192.png",
        tag: "new-match",
        requireInteraction: true,
      });
    }

    // Emit custom event for components to listen to
    const event = new CustomEvent("newMatch", { detail: matchData });
    window.dispatchEvent(event);
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !user || !token) {
      console.log("❌ Cannot initialize socket: No user/token");
      return;
    }

    if (connectionAttemptRef.current) {
      console.log("⚠️ Connection attempt already in progress");
      return;
    }

    connectionAttemptRef.current = true;
    console.log("🔄 Initializing socket connection to:", API_URL);

    // Cleanup existing connection
    cleanupSocket();
    setError(null);

    try {
      const newSocket = io(API_URL, {
        auth: { token },
        transports: ["polling", "websocket"],
        timeout: 20000,
        reconnection: false, // We handle reconnection manually
        forceNew: true,
        autoConnect: true,
      });

      socketRef.current = newSocket;

      // Attach event listeners
      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("connect_error", handleConnectError);
      newSocket.on("error", (error) => handleSocketError(error, "socket"));

      // Chat events
      newSocket.on("new_message", handleNewMessage);
      newSocket.on("user_online", handleUserOnline);
      newSocket.on("user_offline", handleUserOffline);
      newSocket.on("user_typing", handleTypingIndicator);
      newSocket.on("messages_read", handleMessagesRead);
      newSocket.on("new_match", handleNewMatch); // Add new_match handler

      newSocket.on("online_users", (users) => {
        console.log("👥 Online users updated:", users?.length || 0);
        setOnlineUsers(Array.isArray(users) ? users : []);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to create socket:", error);
      connectionAttemptRef.current = false;
      handleSocketError(error, "initialization");
    }
  }, [
    isAuthenticated,
    user,
    token,
    API_URL,
    cleanupSocket,
    handleConnect,
    handleDisconnect,
    handleConnectError,
    handleSocketError,
    handleNewMessage,
    handleUserOnline,
    handleUserOffline,
    handleTypingIndicator,
    handleMessagesRead,
    handleNewMatch, // Add handleNewMatch to dependencies
  ]);

  // Initialize socket when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && token) {
      initializeSocket();
    } else {
      cleanupSocket();
    }

    return () => {
      cleanupSocket();
    };
  }, [isAuthenticated, user, token, initializeSocket, cleanupSocket]);

  // Chat functions with enhanced error handling
  const joinConversation = useCallback(
    (matchId) => {
      if (!socketRef.current || !connected) {
        console.warn("⚠️ Cannot join conversation: Socket not connected");
        return false;
      }

      try {
        console.log("🏠 Joining conversation:", matchId);
        socketRef.current.emit("join_conversation", { matchId });
        return true;
      } catch (error) {
        console.error("Error joining conversation:", error);
        return false;
      }
    },
    [connected]
  );

  const leaveConversation = useCallback(
    (matchId) => {
      if (!socketRef.current || !connected) {
        console.warn("⚠️ Cannot leave conversation: Socket not connected");
        return false;
      }

      try {
        console.log("🚪 Leaving conversation:", matchId);
        socketRef.current.emit("leave_conversation", { matchId });
        return true;
      } catch (error) {
        console.error("Error leaving conversation:", error);
        return false;
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

      try {
        console.log("📤 Sending message:", {
          matchId,
          content: content.substring(0, 50) + "...",
        });

        socketRef.current.emit("send_message", {
          matchId,
          content: content.trim(),
          messageType,
          tempId: Date.now(), // For optimistic updates
        });

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
        return false;
      }
    },
    [connected]
  );

  const startTyping = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        try {
          socketRef.current.emit("typing_start", { matchId });
        } catch (error) {
          console.error("Error starting typing:", error);
        }
      }
    },
    [connected]
  );

  const stopTyping = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        try {
          socketRef.current.emit("typing_stop", { matchId });
        } catch (error) {
          console.error("Error stopping typing:", error);
        }
      }
    },
    [connected]
  );

  const markMessagesAsRead = useCallback(
    (matchId) => {
      if (!socketRef.current || !connected) return false;

      try {
        socketRef.current.emit("mark_messages_read", { matchId });

        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.matchId === matchId ? { ...conv, unreadCount: 0 } : conv
          )
        );

        // Update unread count
        setUnreadCount((prev) => {
          const conversation = conversations.find((c) => c.matchId === matchId);
          return Math.max(0, prev - (conversation?.unreadCount || 0));
        });

        return true;
      } catch (error) {
        console.error("Error marking messages as read:", error);
        return false;
      }
    },
    [connected, conversations]
  );

  // Utility functions
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.some((u) => u.user?._id === userId);
    },
    [onlineUsers]
  );

  const getTypingStatus = useCallback(
    (matchId) => {
      return typingUsers[matchId] || null;
    },
    [typingUsers]
  );

  const reconnect = useCallback(() => {
    console.log("🔄 Manual reconnection triggered");
    setReconnectAttempts(0);
    setError(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    initializeSocket();
  }, [initializeSocket]);

  // Context value
  const contextValue = useMemo(
    () => ({
      // Connection state
      socket: socketRef.current,
      connected,
      error,
      reconnectAttempts,

      // Chat data
      conversations,
      setConversations,
      currentConversation,
      setCurrentConversation,
      messages,
      setMessages,
      unreadCount,
      setUnreadCount,

      // User state
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
      reconnect,
      handleNewMatch,
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
      reconnect,
      handleNewMatch,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
