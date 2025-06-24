import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Event handlers with useCallback to prevent recreation
  const handleNewMessage = useCallback(
    (message) => {
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
    setOnlineUsers((prev) => {
      const existing = prev.find((u) => u.user._id === data.userId);
      if (existing) return prev;
      return [...prev, { user: { _id: data.userId }, lastSeen: new Date() }];
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
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

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      console.log("🔄 Initializing socket connection to:", API_URL);

      const newSocket = io(API_URL, {
        auth: {
          token: token,
        },
        transports: ["polling", "websocket"], // Try polling first, then websocket
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to chat server with ID:", newSocket.id);
        setConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from chat server:", reason);
        setConnected(false);

        // Don't try to reconnect if it was intentional
        if (reason === "io server disconnect") {
          newSocket.connect();
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("🚫 Socket connection error:", error.message);
        setConnected(false);

        // Log specific error details
        if (error.message.includes("websocket error")) {
          console.log("💡 WebSocket failed, will try polling transport");
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Reconnected after", attemptNumber, "attempts");
        setConnected(true);
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("🔄 Reconnection failed:", error.message);
      });

      newSocket.on("reconnect_failed", () => {
        console.error("❌ Failed to reconnect after all attempts");
        setConnected(false);
      });

      // Listen for real-time events
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

      return () => {
        console.log("🧹 Cleaning up socket connection...");
        newSocket.off("new_message", handleNewMessage);
        newSocket.off("message_edited", handleMessageEdited);
        newSocket.off("message_deleted", handleMessageDeleted);
        newSocket.off("user_online", handleUserOnline);
        newSocket.off("user_offline", handleUserOffline);
        newSocket.off("user_typing", handleTypingIndicator);
        newSocket.off("messages_read", handleMessagesRead);
        newSocket.close();
      };
    } else {
      // Clean up if user logs out
      if (socket) {
        console.log("👋 User logged out, closing socket");
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
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
  ]);

  // Chat functions
  const joinConversation = useCallback(
    (matchId) => {
      if (socket && connected) {
        socket.emit("join_conversation", { matchId });
      }
    },
    [socket, connected]
  );

  const leaveConversation = useCallback(
    (matchId) => {
      if (socket && connected) {
        socket.emit("leave_conversation", { matchId });
      }
    },
    [socket, connected]
  );

  const sendMessage = useCallback(
    (matchId, content, messageType = "text") => {
      if (socket && connected && content.trim()) {
        socket.emit("send_message", {
          matchId,
          content: content.trim(),
          messageType,
        });
      }
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

        // Also update local unread count
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
  }, []);

  const value = {
    socket,
    connected,
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
