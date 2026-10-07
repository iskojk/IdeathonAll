"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Socket bağlantısını kur
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (!token) {
      return;
    }

    // WebSocket bağlantısı oluştur
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5002", {
      auth: {
        token: token, // Backend sadece token bekliyor (Bearer prefix'siz)
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`, // Header olarak da gönder
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Bağlantı kuruldu
    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    // Bağlantı koptu
    socketInstance.on("disconnect", (reason) => {
      setIsConnected(false);
    });

    // Bağlantı hatası
    socketInstance.on("connect_error", (error) => {
      setIsConnected(false);
    });

    // Genel hata
    socketInstance.on("error", (error) => {
      // Sessizce hata yönetimi
    });

    // Online/offline event'leri
    socketInstance.on("user:online", (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    socketInstance.on("user:offline", (data) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Conversation'a katıl
  const joinConversation = useCallback(
    (conversationId) => {
      if (!socket || !isConnected) return;
      socket.emit("join:conversation", { conversationId });
    },
    [socket, isConnected]
  );

  // Conversation'dan ayrıl
  const leaveConversation = useCallback(
    (conversationId) => {
      if (!socket || !isConnected) return;
      socket.emit("leave:conversation", { conversationId });
    },
    [socket, isConnected]
  );

  // Typing başlat
  const startTyping = useCallback(
    (conversationId) => {
      if (!socket || !isConnected) return;
      socket.emit("message:typing", { conversationId });
    },
    [socket, isConnected]
  );

  // Typing durdur
  const stopTyping = useCallback(
    (conversationId) => {
      if (!socket || !isConnected) return;
      socket.emit("message:stop-typing", { conversationId });
    },
    [socket, isConnected]
  );

  // Event listener ekle
  const addEventListener = useCallback(
    (event, handler) => {
      if (!socket) return;
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    [socket]
  );

  // Event listener kaldır
  const removeEventListener = useCallback(
    (event, handler) => {
      if (!socket) return;
      socket.off(event, handler);
    },
    [socket]
  );

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    addEventListener,
    removeEventListener,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

