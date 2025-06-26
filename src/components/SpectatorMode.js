import React, { useState, useEffect } from 'react';
import GameEndOverlay from './GameEndOverlay';
import './SpectatorMode.css';

const SpectatorMode = ({
  gameState,
  message,
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

  const renderGameBoard = () => {
    if (!gameState || !gameState.players) {
      return (
        <div className="spectator-waiting">
          <div className="waiting-message">Waiting for game to start...</div>
        </div>
      );
    }

    return (
      <div className="spectator-game-view">
        <div className="spectator-players">
          {gameState.players.map((player, index) => (
            <div key={index} className={`spectator-player ${gameState.currentTurn === index ? 'active' : ''}`}>
              <div className="player-info">
                <span className="player-name">{player.username}</span>
                {!player.isHuman && <span className="ai-badge">AI</span>}
              </div>
              <div className="player-cards">
                <span className="card-count">
                  {gameState.playerHands?.[index]?.length || 0} cards
                </span>
              </div>
              {gameState.playerSpreads?.[index] && gameState.playerSpreads[index].length > 0 && (
                <div className="player-spreads">
                  <span className="spread-count">
                    {gameState.playerSpreads[index].length} spread(s)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="spectator-center">
          <div className="deck-info">
            <div className="deck-count">
              Deck: {gameState.deck?.length || 0} cards
            </div>
            {gameState.discardPile && gameState.discardPile.length > 0 && (
              <div className="discard-top">
                Last discard: {gameState.discardPile[gameState.discardPile.length - 1]?.rank} of {gameState.discardPile[gameState.discardPile.length - 1]?.suit}
              </div>
            )}
          </div>
          
          <div className="game-status">
            {gameState.gameOver ? (
              <div className="game-over">Game Over</div>
            ) : (
              <div className="current-turn">
                {gameState.players[gameState.currentTurn]?.username}'s turn
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="spectator-mode">
      <div className="spectator-header">
        <div className="spectator-status">
          <div className="status-icon">👁️</div>
          <div className="status-text">
            <h3>Spectator Mode</h3>
            <p>{getSpectatorMessage()}</p>
          </div>
        </div>
        
        {transitionId && (
          <div className="transition-indicator">
            <div className="transition-pulse"></div>
            <span>Joining next...</span>
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
        {renderGameBoard()}
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