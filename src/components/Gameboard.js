import React, { useMemo, useEffect, useCallback, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SocketContext } from '../components/SocketContext';
import { useGameSocket } from '../hooks/useGameSocket';
import useGameState from '../hooks/useGameState';
import { CARD_VALUES } from './gameConstants';
import { isValidSpread } from '../utils/gameUtils';
import PlayerSection from './PlayerSection';
import CenterGameArea from './CenterGameArea';
import GameEndOverlay from './GameEndOverlay';
import { LoadingState } from './LoadingState';
import { GameErrorBoundary } from './GameErrorBoundary';
import './GameBoard.css';

const GameBoard = ({ tableId, gameState, setGameState, user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [hitMode, setHitMode] = useState(false);
  const [actionBlockedMessage, setActionBlockedMessage] = useState('');
  const { socket } = useContext(SocketContext);

  const isSpectator = useMemo(() => {
    if (!gameState?.players) return true;
    return !gameState.players.some(p => p?.username === user?.username);
  }, [gameState?.players, user?.username]);

  useGameSocket(socket, tableId, user, gameState, setGameState);

  // Determine player positions (simplified)
  const getOptimalPlayerPositions = useMemo(() => {
    const totalPlayers = gameState.players.length;
    const currentPlayerIndex = gameState.players.findIndex(p => p.username === user?.username);

    const positions = ['bottom', 'left', 'top', 'right'].slice(0, totalPlayers);
    const reorder = (arr) => [
      ...arr.slice(currentPlayerIndex),
      ...arr.slice(0, currentPlayerIndex)
    ];

    return {
      players: reorder(gameState.players),
      hands: reorder(gameState.playerHands),
      spreads: reorder(gameState.playerSpreads),
      adjustedCurrentTurn: (gameState.currentTurn - currentPlayerIndex + totalPlayers) % totalPlayers,
      currentPlayerIndex
    };
  }, [gameState.players, gameState.playerHands, gameState.playerSpreads, gameState.currentTurn, user?.username]);

  const { players: reorderedPlayers, hands: reorderedHands, spreads: reorderedSpreads, adjustedCurrentTurn } = getOptimalPlayerPositions;

  const toggleHitMode = useCallback(() => {
    if (!isSpectator) setHitMode(prev => !prev);
    setSelectedCard(null);
  }, [isSpectator]);

  const handlePlayerAction = useCallback((type) => {
    if (isSpectator) return;
    if (type === 'DRAW_CARD' && !gameState.hasDrawnCard) {
      socket.emit('game_action', { tableId, action: 'DRAW_CARD' });
    }
    if (type === 'DRAW_DISCARD' && !gameState.hasDrawnCard) {
      socket.emit('game_action', { tableId, action: 'DRAW_DISCARD' });
    }
  }, [socket, tableId, gameState.hasDrawnCard, isSpectator]);

  const handleDrop = useCallback(() => {
    if (!isSpectator) socket.emit('game_action', { tableId, action: 'DROP' });
  }, [socket, tableId, isSpectator]);

  const handleCardClick = useCallback((cardIndex) => {
    if (adjustedCurrentTurn !== 0 || isSpectator) return;
    if (hitMode) {
      setSelectedCard(cardIndex);
      return;
    }
    if (gameState.hasDrawnCard) {
      socket.emit('game_action', { tableId, action: 'DISCARD', payload: { cardIndex } });
    } else {
      setActionBlockedMessage('You must draw a card first.');
      setTimeout(() => setActionBlockedMessage(''), 2000);
    }
  }, [adjustedCurrentTurn, isSpectator, hitMode, gameState.hasDrawnCard, socket, tableId]);

  useEffect(() => {
    const ready = Array.isArray(gameState?.playerHands) && Array.isArray(gameState?.deck) && gameState.players.length > 0 && gameState.isInitialized;
    if (ready) setLoading(false);
  }, [gameState]);

  if (loading || !gameState.isInitialized) return <LoadingState />;
  if (!gameState.players || gameState.players.length === 0) return <LoadingState />;

  const showPlayerActions = adjustedCurrentTurn === 0 && !isSpectator;

  return (
    <GameErrorBoundary>
      <div className="game-container">
        {actionBlockedMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50">
            {actionBlockedMessage}
          </div>
        )}

        {/* Opponents + Center Deck */}
        <div className="mobile-game-layout">
          {reorderedPlayers[1] && (
            <PlayerSection
              player={reorderedPlayers[1]}
              hand={reorderedHands[1]}
              spreads={reorderedSpreads[1]}
              isHidden={true}
              className="player-section-opponent"
              position="left"
            />
          )}

          <CenterGameArea
            className="center-game-area-mobile-landscape"
            deck={gameState?.deck || []}
            discardPile={gameState?.discardPile || []}
            currentTurn={adjustedCurrentTurn}
            hasDrawnCard={gameState?.hasDrawnCard || false}
            handlePlayerAction={handlePlayerAction}
            isLoading={false}
            players={reorderedPlayers}
            pot={gameState?.stake * reorderedPlayers.length || 0}
            isSpectator={isSpectator}
          />

          {reorderedPlayers[2] && (
            <PlayerSection
              player={reorderedPlayers[2]}
              hand={reorderedHands[2]}
              spreads={reorderedSpreads[2]}
              isHidden={true}
              className="player-section-opponent"
              position="right"
            />
          )}
        </div>

        {/* Current Player Hand */}
        <div className="player-section-current">
          <PlayerSection
            player={reorderedPlayers[0]}
            hand={reorderedHands[0]}
            spreads={reorderedSpreads[0]}
            isCurrentPlayer={true}
            isHidden={false}
            onCardClick={handleCardClick}
            onDrop={handleDrop}
            onSpread={(cards) => {
              if (isValidSpread(cards)) {
                socket.emit('game_action', { tableId, action: 'SPREAD', payload: { cards } });
              }
            }}
            hitMode={hitMode}
            selectedCard={selectedCard}
            onHit={() => {}} // Hook into your hit logic if needed
            canDrop={!gameState.hasDrawnCard && adjustedCurrentTurn === 0}
            position="bottom"
          />
        </div>

        {/* Action Bar */}
        {showPlayerActions && (
          <div className="action-bar">
            <button onClick={() => handlePlayerAction('DRAW_CARD')}>Draw</button>
            <button onClick={() => handlePlayerAction('DRAW_DISCARD')}>Take Discard</button>
            <button onClick={toggleHitMode}>Hit</button>
            <button onClick={handleDrop}>Drop</button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState?.gameOver && (
          <GameEndOverlay
            winners={gameState.winners}
            players={gameState.players}
            scores={[]}
            stake={Number(gameState.stake)}
            onLeaveTable={() => navigate('/lobby')}
          />
        )}
      </div>
    </GameErrorBoundary>
  );
};

GameBoard.propTypes = {
  tableId: PropTypes.string.isRequired,
  gameState: PropTypes.object.isRequired,
  setGameState: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  isSpectator: PropTypes.bool
};

GameBoard.defaultProps = {
  isSpectator: false
};

export default GameBoard;
