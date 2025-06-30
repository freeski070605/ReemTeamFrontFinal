import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as Colyseus from 'colyseus.js';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [colyseusClient, setColyseusClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // lastPing and currentToken are not directly managed by Colyseus client,
  // but can be derived from room state or client connection status if needed.
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  // Memoize the event handler to ensure stable reference for useEffect cleanup
  const handleLoginSuccess = useCallback(() => {
    console.log('loginSuccess event received in SocketContext. Updating user.');
    setCurrentUserId(localStorage.getItem('userId'));
  }, []);

  useEffect(() => {
    // Add event listener for loginSuccess
    window.addEventListener('loginSuccess', handleLoginSuccess);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, [handleLoginSuccess]); // Dependency on memoized handler

  useEffect(() => {
    // Only attempt to connect if currentUserId and currentToken are available
    if (currentUserId) { // Only userId is needed for Colyseus client initialization
      // Disconnect existing client before creating a new one if dependencies change
      if (colyseusClient) {
        colyseusClient.disconnect();
      }

      const colyseusUrl = process.env.REACT_APP_COLYSEUS_URL || 'ws://localhost:3000'; // Default to localhost
      console.log(`Attempting to connect to Colyseus at: ${colyseusUrl}`);
      const newClient = new Colyseus.Client(colyseusUrl);
      setColyseusClient(newClient);

      // Colyseus client doesn't have a direct 'connect' event like socket.io.
      // Connection status is managed by room join/leave.
      // We'll assume 'connected' once a room is successfully joined.
      // For now, we can set isConnected to true if the client object exists.
      setIsConnected(true); // This will be refined when joining rooms

      // No direct 'ping' or 'heartbeat' needed for Colyseus client,
      // as it's handled internally by the transport.

      return () => {
        // Disconnect the Colyseus client on unmount
        if (newClient) {
          newClient.close();
        }
      };
    } else {
      console.warn('Missing userId in localStorage. Colyseus client connection skipped or disconnected.');
      if (colyseusClient) {
        colyseusClient.close();
        setColyseusClient(null);
        setIsConnected(false);
      }
    }
  }, [currentUserId]); // Dependency on currentUserId

  return (
    <SocketContext.Provider value={{ colyseusClient, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
