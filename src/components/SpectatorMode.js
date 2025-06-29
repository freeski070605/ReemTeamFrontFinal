import React, { useState, useEffect } from 'react';
import GameEndOverlay from './GameEndOverlay';
import Gameboard from './Gameboard'; // Import the Gameboard component
import './SpectatorMode.css';

const SpectatorMode = ({
  gameState,
  setGameState, // Add setGameState prop
  message,
  detailedReason,
  transitionId,
  willJoinNextHand,
  estimatedTime,
  onLeaveSpectator,
  tableId,
  user,
  socket
}) => {
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime || 0);

  useEffect(() => {
    if (estimatedTime && estimatedTime > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [estimatedTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpectatorMessage = () => {
    if (detailedReason) {
      return detailedReason;
    }
    if (transitionId) {
      return timeRemaining > 0
        ? `You'll join when this hand completes (≈${formatTime(timeRemaining)})`
        : 'You\'ll join when this hand completes';
    }

    if (willJoinNextHand) {
      return 'Table is full - you\'ll join the next hand';
    }

    return message || 'Spectating current game';
  };

  return (
    <div className="spectator-mode">
      <div className="spectator-header">
        <div className="spectator-status">
          <div className="status-icon">👁️</div>
          <div className="status-text">
            <h3 className="text-xl font-bold text-lightText">Spectator Mode</h3>
            <p className="text-gray-300">{getSpectatorMessage()}</p>
          </div>
        </div>

        {transitionId && (
          <div className="transition-indicator flex items-center space-x-2 bg-blue-700 text-white px-4 py-2 rounded-full shadow-md">
            <div className="transition-pulse w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span>Joining next hand...</span>
          </div>
        )}
        
        <button
          className="leave-spectator-btn"
          onClick={onLeaveSpectator}
        >
          Leave Table
        </button>
      </div>

      <div className="spectator-content">
        {/* Render the full Gameboard component for spectators */}
        {gameState && gameState.players ? (
          <Gameboard
            tableId={tableId}
            gameState={gameState}
            setGameState={setGameState}
            user={user}
            isSpectator={true} // Explicitly pass isSpectator as true
          />
        ) : (
          <div className="spectator-waiting">
            <div className="waiting-message">Waiting for game to start...</div>
          </div>
        )}
      </div>

      {timeRemaining > 0 && (
        <div className="time-remaining">
          <div className="time-bar">
            <div
              className="time-progress"
              style={{
                width: `${((estimatedTime - timeRemaining) / estimatedTime) * 100}%`
              }}
            ></div>
          </div>
          <span className="time-text">≈{formatTime(timeRemaining)} remaining</span>
        </div>
      )}

      {/* Show GameEndOverlay when game ends for spectators to ready up */}
      {gameState && gameState.gameOver && gameState.gameStarted && tableId && tableId !== 'undefined' && (
        <GameEndOverlay
          gameState={gameState}
          tableId={tableId}
          user={user}
          socket={socket}
          isSpectator={true}
        />
      )}
    </div>
  );
};

export default SpectatorMode;