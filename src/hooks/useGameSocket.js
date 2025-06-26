// File: tonk-game/src/hooks/useGameSocket.js
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { calculateStateHash } from '../utils/gameUtils';

// Single socket instance - prevent multiple connections
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false // Prevent multiple connections
    });
  }
  return socketInstance;
};

export const socket = getSocket();

export const useGameSocket = (socket, tableId, user, gameState, setGameState) => {
  const lastStateRef = useRef(null);
  const lastStateHashRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const playerPositionRef = useRef(null);

  const updateGameState = typeof setGameState === 'function' ? setGameState : () => {
    console.warn('setGameState is not a function');
  };

  useEffect(() => {
    if (!socket || !user || !tableId) return;

    const handleConnect = () => {
      console.log('🟢 Socket connected — requesting state sync:', tableId);
      reconnectAttempts.current = 0;
      socket.emit('request_state_sync', { tableId });
    };

    // Periodic state sync to ensure we get updates (reduced frequency)
    const syncInterval = setInterval(() => {
      if (socket && socket.connected && tableId) {
        console.log('🔄 Periodic state sync request:', tableId);
        socket.emit('request_state_sync', { tableId, type: 'periodic_sync' });
      }
    }, 30000); // Every 30 seconds instead of 3

    const handleStateSync = (newState, eventType = 'state_sync') => {
        // ✅ Add null/undefined check first
        if (!newState) {
            console.warn('🔁 Received null or undefined game update state.');
            return; // Exit if state is invalid
        }

        // ✅ Create state hash for deduplication - but only for periodic syncs
        // Don't deduplicate game action responses (game_update events)
        const shouldDeduplicate = eventType === 'state_sync' || eventType === 'periodic_sync';
        
        if (shouldDeduplicate) {
            const stateHash = JSON.stringify({
                gameOver: newState.gameOver,
                gameStarted: newState.gameStarted,
                currentTurn: newState.currentTurn,
                playerCount: newState.players?.length,
                deckLength: newState.deck?.length,
                discardLength: newState.discardPile?.length,
                timestamp: newState.timestamp
            });

            // ✅ Skip if this is a duplicate state (only for sync events)
            if (lastStateHashRef.current === stateHash) {
                console.log('🔄 Skipping duplicate state update');
                return;
            }
            lastStateHashRef.current = stateHash;
        }

        console.log('SYNC: Received new state from server.', {
            gameOver: newState?.gameOver,
            winType: newState?.winType,
            players: newState?.players?.map(p => p.username),
            playerCount: newState?.players?.length,
            gameStarted: newState?.gameStarted,
            playerHands: newState?.playerHands?.map(hand => hand?.length),
            timestamp: newState?.timestamp,
            eventType: eventType
        });

        // ✅ Special handling for new game start - ensure gameOver is false
        if (newState?.gameStarted && !newState?.gameOver) {
            console.log('🎮 New game detected - ensuring gameOver is false');
        }

      const validPlayers = Array.isArray(newState.players)
        ? newState.players.filter(p => p && p.username)
        : [];
      
      const currentPlayerIndex = validPlayers.findIndex(
        (p) => p.username?.trim().toLowerCase() === user?.username?.trim().toLowerCase()
      );

      if (currentPlayerIndex !== -1) {
        playerPositionRef.current = currentPlayerIndex;
      }

      const sanitizedState = {
        ...newState,
        players: validPlayers,
        currentTurn: typeof newState.currentTurn === 'number' ? newState.currentTurn : 0,
        playerHands: Array.isArray(newState.playerHands) ? newState.playerHands : [],
        playerSpreads: Array.isArray(newState.playerSpreads) ? newState.playerSpreads : [],
        deck: Array.isArray(newState.deck) ? newState.deck : [],
        discardPile: Array.isArray(newState.discardPile) ? newState.discardPile : [],
        isInitialized: true,
        isLoading: false,
        connectionStatus: 'connected',
        error: null,
        lastUpdateTime: Date.now(),
        playerPosition: playerPositionRef.current,
        isMultiplayer: validPlayers.filter(p => p.isHuman).length > 1,
        timestamp: Date.now(), // Force re-render
        hitPenaltyRounds: validPlayers[playerPositionRef.current]?.hitPenaltyRounds || 0
      };

      updateGameState({ ...sanitizedState });
    };


    
    // ✅ Add handler for table assignment
const handleTableAssigned = ({ tableId: assignedTableId, seat }) => {
  console.log('📍 Table assigned:', { assignedTableId, seat, currentTableId: tableId });
  if (assignedTableId === tableId) {
    // ✅ Request fresh state multiple times to ensure we get the latest
    setTimeout(() => {
      console.log('🔄 Requesting state sync after table assignment (1st attempt)');
      socket.emit('request_state_sync', { tableId: assignedTableId });
    }, 1000);
    
    setTimeout(() => {
      console.log('🔄 Requesting state sync after table assignment (2nd attempt)');
      socket.emit('request_state_sync', { tableId: assignedTableId });
    }, 2000);
  }
};
    

    // ✅ Handle player ready updates
    const handlePlayerReadyUpdate = (data) => {
      console.log('📡 Received player_ready_update:', data);
      updateGameState(prev => {
        const newReadyPlayers = Array.isArray(prev.readyPlayers) ? [...prev.readyPlayers] : [];
        if (!newReadyPlayers.includes(data.username)) {
          newReadyPlayers.push(data.username);
        }
        return { ...prev, readyPlayers: newReadyPlayers, timestamp: Date.now() };
      });
    };
    


    const handlePlayerJoined = (data) => {
      console.log('👤 Player joined table:', data);
      updateGameState(prev => ({
        ...prev,
        players: data.players || prev.players,
        message: `${data.playerName} joined the table`
      }));
    };

    const handlePlayerLeft = (data) => {
      console.log('👋 Player left table:', data);
      const message = data.isDisconnect
        ? `${data.username} disconnected from the table`
        : `${data.username} left the table`;
        
      updateGameState(prev => ({
        ...prev,
        players: data.players || prev.players,
        message: message,
        timestamp: Date.now()
      }));
    };

    const handlePlayerReconnected = (data) => {
      console.log('🔄 Player reconnected:', data);
      updateGameState(prev => ({
        ...prev,
        players: data.players || prev.players,
        message: `${data.username} reconnected`,
        timestamp: Date.now()
      }));
    };

    const handleTableStatusUpdate = (data) => {
      if (data.tableId === tableId) {
        updateGameState(prev => ({
          ...prev,
          status: data.status,
          playerCount: data.playerCount
        }));
      }
    };

    const handlePlayersUpdate = ({ players, spectators, readyPlayers }) => {
      console.log('📡 Received table_players_update:', {
        players: players?.map(p => ({ username: p.username, isHuman: p.isHuman })),
        playerCount: players?.length,
        spectators,
        readyPlayers
      });
      updateGameState(prev => ({
        ...prev,
        players: players || prev.players,
        spectators: spectators || prev.spectators,
        readyPlayers: Array.from(readyPlayers || []),
        timestamp: Date.now()
      }));
    };

    const handleDisconnect = (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      updateGameState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        error: 'Connection lost. Attempting to reconnect...'
      }));
    };

    const handleReconnect = (attemptNumber) => {
      console.log('🟡 Socket reconnecting, attempt:', attemptNumber);
      reconnectAttempts.current = attemptNumber;

      if (attemptNumber <= maxReconnectAttempts) {
        updateGameState(prev => ({
          ...prev,
          connectionStatus: 'reconnecting',
          error: `Reconnecting... (${attemptNumber}/${maxReconnectAttempts})`
        }));
      }
    };

    const handleReconnectFailed = () => {
      console.log('🔴 Socket reconnection failed');
      updateGameState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: 'Connection failed. Please refresh the page.'
      }));
    };

    // Handle game starting countdown
    const handleGameStartingCountdown = (data) => {
      console.log('🎮 Game starting countdown:', data);
      // This will be handled by the Table component's countdown logic
      updateGameState(prev => ({
        ...prev,
        gameStartingCountdown: data.countdown,
        message: data.message,
        timestamp: Date.now()
      }));
    };

    const handleGameOver = (data) => {
      console.log('Received game_over event:', data);
      updateGameState(prev => ({
        ...prev,
        gameOver: true,
        winners: data.winners,
        scores: data.scores, // Or appropriate score array from backend
        winType: data.winType,
        timestamp: Date.now() // Force re-render
      }));
    };


    // Register enhanced socket events
    socket.on('connect', handleConnect);
    socket.on('game_update', (newState) => handleStateSync(newState, 'game_update')); // Don't deduplicate game actions
    socket.on('state_sync', (newState) => handleStateSync(newState, 'state_sync')); // Deduplicate periodic syncs
    socket.on('game_started', (newState) => handleStateSync(newState, 'game_started')); // Don't deduplicate game starts
    socket.on('game_starting_countdown', handleGameStartingCountdown);
    socket.on('table_assigned', handleTableAssigned);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('player_reconnected', handlePlayerReconnected);
    socket.on('table_status_update', handleTableStatusUpdate);
    socket.on('table_players_update', handlePlayersUpdate);
    socket.on('player_ready_update', handlePlayerReadyUpdate);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('game_over', handleGameOver);

    return () => {
      clearInterval(syncInterval); // Clean up interval
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('game_update');
      socket.off('state_sync');
      socket.off('game_started'); // Clean up game_started handler
      socket.off('game_starting_countdown', handleGameStartingCountdown);
      socket.off('table_assigned', handleTableAssigned);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('player_reconnected', handlePlayerReconnected);
      socket.off('table_status_update', handleTableStatusUpdate);
      socket.off('table_players_update', handlePlayersUpdate);
      socket.off('player_ready_update', handlePlayerReadyUpdate);
      socket.off('game_over', handleGameOver);
    };
  }, [socket, tableId, user?.username]);
};


export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { isConnected };
};


