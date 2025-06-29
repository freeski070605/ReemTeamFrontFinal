import React, { useEffect, useState, useContext, createContext, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from './Gameboard';
import SpectatorMode from './SpectatorMode';
import { UserContext } from './UserContext';
import ChipSystem from '../utils/ChipSystem';
import { GameErrorBoundary } from './GameErrorBoundary';
import { SocketContext } from '../components/SocketContext';
import { useSocketConnection, useGameSocket } from '../hooks/useGameSocket';
import './Table.css';
import AuthService from './AuthService';
export const GameContext = createContext();

const TableComponent = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserChips } = useContext(UserContext);
  const { isConnected } = useSocketConnection();
  const [hasJoined, setHasJoined] = useState(false);
  const [manualLeave, setManualLeave] = useState(false);
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);
  const [spectatorData, setSpectatorData] = useState(null);
  const [transitionStatus, setTransitionStatus] = useState(null);
  const [autoStartCountdown, setAutoStartCountdown] = useState(null);
  const hasJoinedRef = useRef(false);
  const { socket } = useContext(SocketContext); // ✅ context-based socket
  const [gameState, setGameState] = useState({
    players: [],
    stake: 0,
    deck: [],
    discardPile: [],
    currentTurn: 0,
    playerHands: [],
    playerSpreads: [],
    hasDrawnCard: false,
    gameOver: false,
    isLoading: true,
    isInitialized: false,
    gameStarted: false,
    connectionStatus: 'connecting',
    error: null,
    message: null, // Added for general messages
    gameStartingCountdown: null, // Added for countdown
    transitionActive: false, // Added for transition state
    readyForNewHand: false, // Added for new hand readiness
    timestamp: Date.now() // Added to force re-renders when state changes
  });

  const isPlayerSeated = gameState.players.some(p => p.username === user?.username);

  useGameSocket(socket, tableId, user, gameState, setGameState);

  // Enhanced socket event handlers for spectator mode and transitions
  useEffect(() => {
    if (!socket) return;

    const handleSpectatorModeActive = (data) => {
      console.log('🎭 Spectator mode activated:', data);
      setIsSpectatorMode(true);
      setSpectatorData({
        message: data.message,
        transitionId: data.transitionId,
        willJoinNextHand: data.willJoinNextHand,
        estimatedTime: data.estimatedTime,
        gameState: data.gameState
      });
      setGameState(prev => ({ ...prev, message: data.message, timestamp: Date.now() }));
    };

    const handlePlayerModeActivated = async (data) => {
      console.log('🎮 Player mode activated:', data);
      setIsSpectatorMode(false);
      setSpectatorData(null);
      setTransitionStatus(null);
      
      // Fetch latest table state to update players list
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tables/${tableId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const tableData = await response.json();
          setGameState(prev => ({
            ...prev,
            players: tableData.table.players || [],
            message: data.message,
            timestamp: Date.now()
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            message: data.message,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        setGameState(prev => ({
          ...prev,
          message: data.message,
          timestamp: Date.now()
        }));
      }
    };

    const handleTransitionInitiated = (data) => {
      console.log('🔄 Transition initiated:', data);
      setTransitionStatus(data);
      
      // Update game state with transition message
      setGameState(prev => ({
        ...prev,
        message: data.message,
        transitionActive: true,
        timestamp: Date.now()
      }));
    };

    const handleTransitionCompleted = (data) => {
      console.log('✅ Transition completed:', data);
      setTransitionStatus(null);
      
      setGameState(prev => ({
        ...prev,
        message: data.message,
        transitionActive: false,
        readyForNewHand: data.readyForNewHand,
        timestamp: Date.now()
      }));
    };

    const handlePromotedToPlayer = async (data) => {
      console.log('⬆️ Promoted to player:', data);
      setIsSpectatorMode(false);
      setSpectatorData(null);
      
      // Fetch latest table state to update players list
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tables/${tableId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const tableData = await response.json();
          setGameState(prev => ({
            ...prev,
            players: tableData.table.players || [],
            message: data.message,
            timestamp: Date.now()
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            message: data.message,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        setGameState(prev => ({
          ...prev,
          message: data.message,
          timestamp: Date.now()
        }));
      }
    };

    // Register enhanced event handlers
    socket.on('spectator_mode_active', handleSpectatorModeActive);
    socket.on('player_mode_activated', handlePlayerModeActivated);
    socket.on('transition_initiated', handleTransitionInitiated);
    socket.on('transition_completed', handleTransitionCompleted);
    socket.on('promoted_to_player', handlePromotedToPlayer);

    return () => {
      socket.off('spectator_mode_active', handleSpectatorModeActive);
      socket.off('player_mode_activated', handlePlayerModeActivated);
      socket.off('transition_initiated', handleTransitionInitiated);
      socket.off('transition_completed', handleTransitionCompleted);
      socket.off('promoted_to_player', handlePromotedToPlayer);
    };
  }, [socket, tableId, setGameState]);

  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    (async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tables/${tableId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 404) return navigate('/lobby');
                throw new Error('Failed to fetch table details');
            }
            const data = await response.json();
            const isSeated = data.table.players.some(p => p && p.username === user?.username);
            
            console.log('Table.js: Fetched table data:', {
                tableId,
                players: data.table.players.map(p => ({ username: p.username, isHuman: p.isHuman })),
                currentUser: user.username,
                isSeated
            });
            setGameState(prev => ({
                ...prev,
                players: data.table.players || [],
                stake: data.table.stake,
                currentTurn: data.table.gameState?.currentTurn ?? 0,
                isLoading: false,
                isInitialized: true,
                connectionStatus: 'connected',
                gameStarted: data.table.gameStarted || false, // Initialize gameStarted
                gameStartingCountdown: data.table.gameStartingCountdown || null // Initialize countdown
            }));
            
            // Enhanced join logic - let backend determine player vs spectator status
            console.log('Table.js: Attempting to join table with enhanced logic.');
            socket.emit('join_table', {
                tableId,
                player: {
                    username: user.username,
                    chips: user.chips,
                    isHuman: true
                }
            });

            setHasJoined(true);
        } catch (error) {
            console.error('Error fetching table details:', error);
            setGameState(prev => ({ ...prev, error: error.message, isLoading: false, connectionStatus: 'error' }));
        }
    })();
}, [tableId, user, navigate, setGameState, socket]);

  // Auto-start countdown effect - use backend countdown
  useEffect(() => {
    if (gameState.gameStartingCountdown) {
      setAutoStartCountdown(gameState.gameStartingCountdown);
      
      // Start local countdown that syncs with backend
      const countdownInterval = setInterval(() => {
        setAutoStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    } else if (gameState.gameStarted) {
      // Game started, clear countdown
      setAutoStartCountdown(null);
    }
  }, [gameState.gameStartingCountdown, gameState.gameStarted]);

  // Handle ready-up
  const handlePlayerReady = useCallback(() => {
    if (socket && socket.connected && user && tableId) {
      console.log('Player ready button clicked');
      socket.emit('player_ready', { tableId, username: user.username });
    }
  }, [socket, user, tableId]);

  const leaveTable = async () => {
    setManualLeave(true);
    
    if (socket && socket.connected) {
      socket.emit('leave_table', { tableId, username: user.username });
    }
  
    try {
      await AuthService.leaveTable(tableId, user.username);
      navigate('/lobby');
    } catch (err) {
      console.error('Leave table failed:', err);
      setManualLeave(false);
    }
  };

  // Handle reconnection attempts
  const attemptReconnection = () => {
    if (socket && user && tableId && !isPlayerSeated) {
      console.log('Attempting to reconnect to table...');
      socket.emit('reconnect_player', { tableId, username: user.username });
    } else if (isPlayerSeated) {
      console.log('Player already seated, no reconnection needed');
    }
  };

  // Auto-reconnect on connection restore if not manually left and was previously disconnected
  useEffect(() => {
    if (isConnected && !manualLeave && hasJoined && user && gameState.connectionStatus === 'disconnected') {
      console.log('Connection restored after disconnect, attempting reconnection...');
      attemptReconnection();
    }
  }, [isConnected, manualLeave, hasJoined, user, gameState.connectionStatus, tableId, isPlayerSeated, socket]);
  

  

  const getConnectionStatus = () => {
    if (gameState.connectionStatus === 'reconnecting') {
      return `Reconnecting... ${gameState.error || ''}`;
    }
    if (gameState.connectionStatus === 'failed') {
      return 'Connection Failed';
    }
    if (gameState.connectionStatus === 'disconnected') {
      return 'Disconnected';
    }
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const connectionStatus = getConnectionStatus();

  if (gameState.isLoading || !gameState.isInitialized) return <div>Loading game...</div>;
  if (gameState.error && gameState.connectionStatus === 'failed') {
    return (
      <div className="connection-error">
        <div>Connection Error: {gameState.error}</div>
        <button onClick={attemptReconnection}>Retry Connection</button>
        <button onClick={() => navigate('/lobby')}>Return to Lobby</button>
      </div>
    );
  }

  if (isSpectatorMode && spectatorData) {
    const spectatorMessage = spectatorData.message || "You are currently in spectator mode.";
    let detailedSpectatorReason = "";

    if (spectatorData.message.includes("table is full")) {
      detailedSpectatorReason = "The table is currently full. You will join the next available spot.";
    } else if (spectatorData.message.includes("not enough chips")) {
      detailedSpectatorReason = `You don't have enough chips for this table's stake ($${gameState.stake}).`;
    } else if (spectatorData.message.includes("game in progress")) {
      detailedSpectatorReason = "A game is currently in progress. You will join the next hand.";
    } else {
      detailedSpectatorReason = "You are observing the current game.";
    }

    return (
      <GameContext.Provider value={{ gameState, setGameState }}>
        <GameErrorBoundary>
          <SpectatorMode
            gameState={spectatorData.gameState || gameState}
            message={spectatorMessage}
            detailedReason={detailedSpectatorReason} // Pass detailed reason
            transitionId={spectatorData.transitionId}
            willJoinNextHand={spectatorData.willJoinNextHand}
            estimatedTime={spectatorData.estimatedTime}
            onLeaveSpectator={leaveTable}
          />
        </GameErrorBoundary>
      </GameContext.Provider>
    );
  }

  if (!Array.isArray(gameState.players) || gameState.players.length === 0) return <div>Waiting for players...</div>;

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      <GameErrorBoundary> 
        {/* Connection Status */}
            <div className="connection-indicator fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg text-sm font-semibold">
              <span className={`status ${gameState.connectionStatus === 'connected' ? 'text-green-400 bg-gray-800' : 'text-red-400 bg-gray-800'} px-3 py-1 rounded-full`}>
                {gameState.connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
              {gameState.connectionStatus !== 'connected' && gameState.error && (
                <p className="text-red-300 mt-1">{gameState.error}</p>
              )}
              {gameState.connectionStatus !== 'connected' && (
                <button
                  onClick={leaveTable}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Return to Lobby
                </button>
              )}
            </div>
        <div className="table-wrapper" style={{ position: 'relative', overflow: 'visible', minHeight: '100vh' }}>
          {/* Transition banner overlays the table, does not cover gameboard */}
          {transitionStatus && (
            <div className="transition-banner fixed top-0 left-0 w-full bg-blue-800 text-white text-center p-3 z-40 shadow-lg">
              <div className="transition-message text-lg font-semibold">
                🔄 {transitionStatus.message}
                {transitionStatus.estimatedTime && (
                  <span className="transition-time ml-2 text-blue-200">
                    (Est. {Math.round(transitionStatus.estimatedTime)}s remaining)
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Indicators and Leave Button */}
          {/* <div className="game-indicators-and-actions"> */}
            {/* Show waiting message with countdown for new tables */}
            {!gameState.gameStarted && !gameState.gameOver && isPlayerSeated && gameState.players.length < 4 && (
              <div className="waiting-status fixed top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-lightText p-3 rounded-lg shadow-xl z-30">
                <p className="text-lg font-semibold mb-2">Waiting for players...</p>
                {autoStartCountdown !== null ? (
                  <p className="text-accentGold">🎮 Game starting in {autoStartCountdown}s...</p>
                ) : (
                  <p className="text-gray-400">Invite friends or wait for more players to join this table.</p>
                )}
              </div>
            )}
                 
            <button
              className="leave-button"
              onClick={leaveTable}
              disabled={gameState.hasDrawnCard}
            >
              Leave Table
            </button>      
            
           
          {/* </div> */}

          {/* Gameboard is fully contained and never covered */}
          <div className="table-content" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
            <GameBoard
              tableId={tableId}
              gameState={gameState}
              setGameState={setGameState}
              socket={socket}
              user={user}
            />
          </div>
          
     

         
        </div>
      </GameErrorBoundary>
    </GameContext.Provider>
  );
};

export default TableComponent;
