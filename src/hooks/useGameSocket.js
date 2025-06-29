// File: tonk-game/src/hooks/useGameSocket.js
import { useEffect, useState, useRef } from 'react';
import { calculateStateHash } from '../utils/gameUtils';

export const useGameSocket = (socket, tableId, user, gameState, setGameState) => {
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
      updateGameState(prev => ({ ...prev, error: null, connectionStatus: 'connected' })); // Clear error and confirm connected status
    };

    const syncInterval = setInterval(() => {
      if (socket?.connected && tableId) {
        console.log('🔄 Periodic state sync request:', tableId);
        socket.emit('request_state_sync', { tableId, type: 'periodic_sync' });
      }
    }, 30000);

    const handleStateSync = (newState, eventType = 'state_sync') => {
      if (!newState) return;

      const shouldDeduplicate = ['state_sync', 'periodic_sync'].includes(eventType);
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

        if (lastStateHashRef.current === stateHash) {
          console.log('🔄 Skipping duplicate state update');
          return;
        }

        lastStateHashRef.current = stateHash;
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
        timestamp: Date.now(),
        hitPenaltyRounds: validPlayers[playerPositionRef.current]?.hitPenaltyRounds || 0
      };

      updateGameState({ ...sanitizedState });
    };

    const handleGameStartingCountdown = (data) => {
      updateGameState(prev => ({
        ...prev,
        gameStartingCountdown: data.countdown,
        message: data.message,
        timestamp: Date.now()
      }));
    };

    const handleTableAssigned = ({ tableId: assignedTableId, seat }) => {
      if (assignedTableId === tableId) {
        setTimeout(() => socket.emit('request_state_sync', { tableId: assignedTableId }), 1000);
        setTimeout(() => socket.emit('request_state_sync', { tableId: assignedTableId }), 2000);
      }
    };

    const handlePlayerReadyUpdate = (data) => {
      updateGameState(prev => {
        const newReadyPlayers = [...(prev.readyPlayers || [])];
        if (!newReadyPlayers.includes(data.username)) {
          newReadyPlayers.push(data.username);
        }
        return { ...prev, readyPlayers: newReadyPlayers, timestamp: Date.now() };
      });
    };

    const handlePlayerJoined = (data) => {
      updateGameState(prev => ({
        ...prev,
        players: data.players || prev.players,
        message: `${data.playerName} joined the table`
      }));
    };

    const handlePlayerLeft = (data) => {
      const message = data.isDisconnect
        ? `${data.username} disconnected from the table`
        : `${data.username} left the table`;

      updateGameState(prev => ({
        ...prev,
        players: data.players || prev.players,
        message,
        timestamp: Date.now()
      }));
    };

    const handlePlayerReconnected = (data) => {
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
        error: null // Remove the specific message
      }));
    };

    const handleReconnect = (attemptNumber) => {
      reconnectAttempts.current = attemptNumber;
      if (attemptNumber <= maxReconnectAttempts) {
        updateGameState(prev => ({
          ...prev,
          connectionStatus: 'reconnecting',
          error: null // Remove the specific message
        }));
      }
    };

    const handleReconnectFailed = () => {
      updateGameState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: 'Connection failed. Please refresh the page.'
      }));
    };

    const handleGameOver = (data) => {
      updateGameState(prev => ({
        ...prev,
        gameOver: true,
        winners: data.winners,
        scores: data.scores,
        winType: data.winType,
        timestamp: Date.now()
      }));
    };

    // Register all events
    socket.on('connect', handleConnect);
    socket.on('game_update', (state) => handleStateSync(state, 'game_update'));
    socket.on('state_sync', (state) => handleStateSync(state, 'state_sync'));
    socket.on('game_started', (state) => handleStateSync(state, 'game_started'));
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
      clearInterval(syncInterval);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('game_update');
      socket.off('state_sync');
      socket.off('game_started');
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


export const useSocketConnection = (socket) => {
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return { isConnected };
};
