// File: tonk-game/src/hooks/useGameSocket.js
import { useEffect, useState, useRef, useCallback } from 'react';
import * as Colyseus from 'colyseus.js';
// import { calculateStateHash } from '../utils/gameUtils'; // No longer needed for Colyseus state hashing

export const useGameSocket = (colyseusClient, tableId, user, gameState, setGameState) => {
  const roomRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const playerPositionRef = useRef(null);
  const isConnectingRef = useRef(false); // To prevent multiple connection attempts

  const updateGameState = typeof setGameState === 'function' ? setGameState : () => {
    console.warn('setGameState is not a function');
  };

  const connectToRoom = useCallback(async () => {
    if (!colyseusClient || !user || !tableId || isConnectingRef.current) {
      console.log('Skipping connectToRoom:', { colyseusClient, user, tableId, isConnecting: isConnectingRef.current });
      return;
    }

    isConnectingRef.current = true;
    updateGameState(prev => ({ ...prev, connectionStatus: 'connecting', error: null, isLoading: true }));

    try {
      console.log(`Attempting to join Colyseus room 'game_room' with tableId: ${tableId}`);
      const room = await colyseusClient.joinOrCreate('game_room', {
        tableId,
        username: user.username,
        chips: user.chips,
        // Add any other initial player data needed by the room
      });
      roomRef.current = room;
      reconnectAttempts.current = 0;

      console.log('🟢 Colyseus room joined successfully:', room.id);
      updateGameState(prev => ({ ...prev, connectionStatus: 'connected', error: null, isLoading: false }));

      room.onStateChange((state) => {
        console.log('🔄 Colyseus state update received:', state);
        const validPlayers = Array.isArray(state.players)
          ? state.players.filter(p => p && p.username)
          : [];

        const currentPlayerIndex = validPlayers.findIndex(
          (p) => p.username?.trim().toLowerCase() === user?.username?.trim().toLowerCase()
        );

        if (currentPlayerIndex !== -1) {
          playerPositionRef.current = currentPlayerIndex;
        }

        const sanitizedState = {
          ...state,
          players: validPlayers,
          currentTurn: typeof state.currentTurn === 'number' ? state.currentTurn : 0,
          playerHands: Array.isArray(state.playerHands) ? state.playerHands : [],
          playerSpreads: Array.isArray(state.playerSpreads) ? state.playerSpreads : [],
          deck: Array.isArray(state.deck) ? state.deck : [],
          discardPile: Array.isArray(state.discardPile) ? state.discardPile : [],
          isInitialized: true,
          isLoading: false,
          connectionStatus: 'connected',
          error: null,
          lastUpdateTime: Date.now(),
          playerPosition: playerPositionRef.current,
          isMultiplayer: validPlayers.filter(p => p.isHuman).length > 1,
          timestamp: Date.now(),
          hitPenaltyRounds: validPlayers[playerPositionRef.current]?.hitPenaltyRounds || 0,
          chipBalances: state.chipBalances ? Object.fromEntries(state.chipBalances) : {}, // Convert MapSchema to plain object
          readyPlayers: Array.isArray(state.readyPlayers) ? state.readyPlayers : [],
          pot: state.pot || 0,
          gameStartingCountdown: state.gameStartingCountdown || 0,
          message: state.message || ""
        };
        updateGameState(sanitizedState);
      });

      room.onMessage("player_joined", (data) => {
        console.log('Colyseus: player_joined', data);
        updateGameState(prev => ({
          ...prev,
          players: data.players || prev.players,
          message: `${data.username} joined the table`,
          timestamp: Date.now()
        }));
      });

      room.onMessage("player_left", (data) => {
        console.log('Colyseus: player_left', data);
        updateGameState(prev => ({
          ...prev,
          players: data.players || prev.players,
          message: `${data.username} left the table`,
          timestamp: Date.now()
        }));
      });

      room.onMessage("player_reconnected", (data) => {
        console.log('Colyseus: player_reconnected', data);
        updateGameState(prev => ({
          ...prev,
          players: data.players || prev.players,
          message: `${data.username} reconnected`,
          timestamp: Date.now()
        }));
      });

      room.onMessage("player_ready_update", (data) => {
        console.log('Colyseus: player_ready_update', data);
        updateGameState(prev => ({
          ...prev,
          readyPlayers: data.readyPlayers || [],
          timestamp: Date.now()
        }));
      });

      room.onMessage("game_starting_countdown", (data) => {
        console.log('Colyseus: game_starting_countdown', data);
        updateGameState(prev => ({
          ...prev,
          gameStartingCountdown: data.countdown,
          message: data.message,
          timestamp: Date.now()
        }));
      });

      room.onMessage("game_over", (data) => {
        console.log('Colyseus: game_over', data);
        updateGameState(prev => ({
          ...prev,
          gameOver: true,
          winners: data.winners,
          scores: data.scores,
          winType: data.winType,
          timestamp: Date.now()
        }));
      });

      room.onLeave((code) => {
        console.log('🔴 Colyseus room left:', code);
        updateGameState(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          error: 'Disconnected from game room.',
          isLoading: false
        }));
        roomRef.current = null;
      });

      room.onError((code, message) => {
        console.error('🚨 Colyseus room error:', code, message);
        updateGameState(prev => ({
          ...prev,
          connectionStatus: 'error',
          error: `Game error: ${message} (Code: ${code})`,
          isLoading: false
        }));
      });

    } catch (e) {
      console.error('🚨 Colyseus connection failed:', e);
      updateGameState(prev => ({
        ...prev,
        connectionStatus: 'failed',
        error: `Failed to connect to game: ${e.message}`,
        isLoading: false
      }));
      roomRef.current = null;
    } finally {
      isConnectingRef.current = false;
    }
  }, [colyseusClient, tableId, user, updateGameState]);

  useEffect(() => {
    connectToRoom();

    return () => {
      if (roomRef.current) {
        console.log('🚪 Leaving Colyseus room on unmount.');
        roomRef.current.leave();
        roomRef.current = null;
      }
    };
  }, [connectToRoom]);

  // Expose a send function for game actions
  const sendGameAction = useCallback((action, payload) => {
    if (roomRef.current) {
      console.log(`Sending game_action: ${action}`, payload);
      roomRef.current.send('game_action', { action, payload });
    } else {
      console.warn('Cannot send game action: Not connected to a Colyseus room.');
    }
  }, []);

  const sendPlayerReady = useCallback((username) => {
    if (roomRef.current) {
      console.log(`Sending player_ready for ${username}`);
      roomRef.current.send('player_ready', { username });
    } else {
      console.warn('Cannot send player ready: Not connected to a Colyseus room.');
    }
  }, []);

  return { room: roomRef.current, sendGameAction, sendPlayerReady };
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
