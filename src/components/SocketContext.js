// tonk-game/src/components/SocketContext.js
import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

// Create socket instance
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  query: {
    userId: localStorage.getItem('userId'),
    token: localStorage.getItem('token')
  }
});

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    // Connect socket when provider mounts
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const handlePing = () => setLastPing(Date.now());

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('ping', handlePing);

    // Implement heartbeat
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('ping', handlePing);
      clearInterval(heartbeat);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastPing }}>
      {children}
    </SocketContext.Provider>
  );
};
