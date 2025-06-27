import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { UserContext } from './UserContext'; // Import UserContext

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(UserContext); // Get user from UserContext
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    // Only attempt to connect if user data is available
    if (!user || !user._id) {
      console.warn('User not authenticated, skipping socket connection.');
      if (socket) {
        socket.disconnect(); // Disconnect existing socket if user logs out
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const userId = user._id; // Get userId from the user object
    const token = localStorage.getItem('token'); // Token is still stored in localStorage

    if (!token) {
      console.warn('Missing token in localStorage, skipping socket connection.');
      return;
    }
    
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://reemteamserver.onrender.com';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: { userId, token }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('ping', () => setLastPing(Date.now()));

    const heartbeat = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    return () => {
      newSocket.disconnect();
      clearInterval(heartbeat);
    };
  }, [user]); // Re-run effect when the 'user' object changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastPing }}>
      {children}
    </SocketContext.Provider>
  );
};
