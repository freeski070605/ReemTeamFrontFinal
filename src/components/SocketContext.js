import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [currentToken, setCurrentToken] = useState(localStorage.getItem('token'))

  // Memoize the event handler to ensure stable reference for useEffect cleanup
  const handleLoginSuccess = useCallback(() => {
    console.log('loginSuccess event received in SocketContext. Updating user and token.');
    setCurrentUserId(localStorage.getItem('userId'));
    setCurrentToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    
    if (!currentUserId || !currentToken) {
      console.warn('Missing userId or token in localStorage');
      return;
    }
    
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://reemteamserver.onrender.com';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: { currentUserId, currentToken }
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

    window.addEventListener('loginSuccess', handleLoginSuccess);


    return () => {
      newSocket.disconnect();
      clearInterval(heartbeat);
      window.removeEventListener('loginSuccess', handleLoginSuccess);

    };
  }, [currentUserId, currentToken, handleLoginSuccess]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastPing }}>
      {children}
    </SocketContext.Provider>
  );
};
