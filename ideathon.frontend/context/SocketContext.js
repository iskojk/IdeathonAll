import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    // Sadece kullanıcı giriş yapmışsa socket bağlantısı kur
    if (!user || typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Socket.IO bağlantısı kur
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5002';
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    // Bağlantı olayları
    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Bağlantı kurulduğunda online kullanıcıları getir
      fetch(`${process.env.NEXT_PUBLIC_MENTORNET_API_URL || 'http://localhost:5002/api/mentornet'}/messages/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.users) {
            const userIds = data.data.users.map(u => u._id);
            setOnlineUsers(new Set(userIds));
          }
        })
        .catch(err => console.error('Online kullanıcılar yüklenemedi:', err));
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      // Bağlantı kesildiğinde online listesini temizle
      setOnlineUsers(new Set());
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket.IO bağlantı hatası:', error.message);
    });

    // Kullanıcı online/offline olayları
    newSocket.on('user:online', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    });

    newSocket.on('user:offline', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Hata olayları
    newSocket.on('error', (error) => {
      console.error('🔴 Socket.IO hatası:', error);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
      socketRef.current = null;
      setOnlineUsers(new Set());
    };
  }, [user]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

