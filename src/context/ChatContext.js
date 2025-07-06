// src/context/ChatContext.js - FIXED VERSION

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
  const maxReconnectAttempts = 5;

  // Clear all timeouts function
  const clearAllTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    typingTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    typingTimeoutsRef.current.clear();
  }, []);

  // Socket event handlers
  const handleConnect = useCallback(() => {
    console.log("✅ Connected to chat server");
    setConnected(true);
    setError(null);
    setReconnectAttempts(0);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  const handleDisconnect = useCallback((reason) => {
    console.log("❌ Disconnected from chat server:", reason);
    setConnected(false);
    if (reason !== "io client disconnect") {
      handleReconnection();
    }
  }, []);

  const handleConnectError = useCallback((error) => {
    console.error("🚫 Socket connection error:", error.message);
    setConnected(false);
    setError(`Connection failed: ${error.message}`);
    handleReconnection();
  }, []);

  const handleNewMessage = useCallback(
    (message) => {
      console.log("📧 New message received:", message);

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

      if (message.sender._id !== user?._id) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [currentConversation, user]
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

      if (typingTimeoutsRef.current.has(matchId)) {
        clearTimeout(typingTimeoutsRef.current.get(matchId));
      }

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

  const handleError = useCallback((error) => {
    console.error("⚠️ Socket error:", error);
    setError(`Socket error: ${error.message || error}`);
  }, []);

  // Handle reconnection with exponential backoff
  const handleReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      setError("Unable to connect to chat server. Please refresh the page.");
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
      initializeSocket();
    }, delay);
  }, [reconnectAttempts, clearAllTimeouts]);

  // Socket cleanup function
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      console.log("🧹 Cleaning up socket connection...");
      socketRef.current.removeAllListeners();
      socketRef.current.close();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!user || !token) {
      console.log("❌ Cannot initialize socket: No user/token");
      return;
    }

    cleanupSocket();

    console.log("🔄 Initializing socket connection to:", API_URL);
    setError(null);

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      timeout: 20000,
      forceNew: true,
      reconnection: false,
    });

    socketRef.current = newSocket;

    // Attach event listeners
    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("error", handleError);
    newSocket.on("new_message", handleNewMessage);
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
    }

    return () => {
      cleanupSocket();
    };
  }, [user, token, initializeSocket, cleanupSocket]);

  // Chat functions
  const joinConversation = useCallback(
    (matchId) => {
      if (socketRef.current && connected) {
        console.log("🏠 Joining conversation:", matchId);
        socketRef.current.emit("join_conversation", { matchId });
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

      socketRef.current.emit("send_message", {
        matchId,
        content: content.trim(),
        messageType,
      });

      return true;
    },
    [connected]
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

        setConversations((prev) =>
          prev.map((conv) =>
            conv.matchId === matchId ? { ...conv, unreadCount: 0 } : conv
          )
        );

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

  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
    clearAllTimeouts();
    initializeSocket();
  }, [initializeSocket, clearAllTimeouts]);

  // Context value
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
      joinConversation,
      leaveConversation,
      sendMessage,
      startTyping,
      stopTyping,
      markMessagesAsRead,
      isUserOnline,
      getTypingStatus,
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
      reconnect,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
