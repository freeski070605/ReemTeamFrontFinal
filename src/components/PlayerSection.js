import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import PlayerSpreads from './PlayerSpreads';
import PlayerActions from './PlayerActions';
import { isValidSpread, calculatePoints } from '../utils/gameUtils';

const MemoizedPlayerInfo = memo(PlayerInfo);
const MemoizedPlayerHand = memo(PlayerHand);
const MemoizedPlayerSpreads = memo(PlayerSpreads);
const MemoizedPlayerActions = memo(PlayerActions);

const PlayerSection = ({
  position,
  className,
  player,
  hand,
  spreads,
  isCurrentTurn,
  hasDrawnCard,
  isHidden,
  onDrop,
  hitMode,
  selectedCard,
  onCardSelect,
  onHit,
  onToggleHitMode,
  onSpread,
  canHit,
  canDrop,
  gameState,
  setGameState,
  onActionComplete,
  onCardClick,
  playerIndex,
  isCurrentPlayer,
  isSpectator,
  showActions,
  validHitSpreads
}) => {
  const [error, setError] = useState(null);

  const safeHand = Array.isArray(hand) ? hand : [];
  const safeSpreads = Array.isArray(spreads) ? spreads : [];

  const penalties = gameState?.penalties || {};

  const canDropBasedOnPoints = !isSpectator && calculatePoints(safeHand) <= 30 && !hasDrawnCard && isCurrentTurn;

  const handleDropAction = () => {
    if (!isSpectator && canDropBasedOnPoints) {
      onDrop();
      onActionComplete?.('DROP');
    }
  };

  const handleSpread = (cards) => {
    if (!isSpectator && isValidSpread(cards)) {
      onSpread(cards);
    }
  };

  const handleHit = (cardIndex, targetIndex, spreadIndex) => {
    if (!isSpectator) onHit(cardIndex, targetIndex, spreadIndex);
  };

  const handleCardClick = (cardIndex) => {
    if (!isSpectator) onCardClick(cardIndex);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /** Opponent simplified rendering (avatars + card backs) */
  if (!isCurrentPlayer) {
    return (
      <div className={`flex flex-col items-center justify-center p-2 rounded-md bg-black/40 text-white ${className || ''}`}>
        <MemoizedPlayerInfo player={player} isActive={isCurrentTurn} />
        {/* Opponent hand shows only backs */}
        <div className="flex gap-1 mt-1">
          {safeHand.map((_, i) => (
            <div key={i} className="card bg-gray-500 rounded-sm w-6 h-9 shadow-md" />
          ))}
        </div>
        {penalties[position] > 0 && (
          <div className="text-red-400 text-xs mt-1">Penalized: {penalties[position]}</div>
        )}
      </div>
    );
  }

  /** Current player (full controls) */
  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-md bg-darkBackground/90 shadow-md border border-transparent relative ${isCurrentTurn ? 'border-yellow-400 shadow-lg' : ''} ${className || ''}`}
    >
      {error && <div className="text-red-500 text-sm font-bold mb-1">{error}</div>}

      <MemoizedPlayerInfo player={player} isActive={isCurrentTurn} handScore={calculatePoints(safeHand)} />

      <MemoizedPlayerHand
        cards={safeHand}
        isActive={isCurrentTurn && !isSpectator}
        onCardClick={handleCardClick}
        isHidden={false}
        hitMode={hitMode}
        onToggleHitMode={onToggleHitMode}
        selectedCard={selectedCard}
        onCardSelect={onCardSelect}
        className="w-full mt-1"
        playerIndex={playerIndex}
      />

      <MemoizedPlayerSpreads
        spreads={safeSpreads}
        onSpreadClick={handleHit}
        isHitModeActive={hitMode}
        selectedCard={selectedCard}
        isCurrentPlayer={isCurrentPlayer}
        isSpectator={isSpectator}
        position={position}
        playerIndex={playerIndex}
        validHitSpreads={validHitSpreads[playerIndex] || []}
        className="w-full mt-2"
      />

      {showActions && isCurrentTurn && !isSpectator && (
  <MemoizedPlayerActions
    isActive={isCurrentTurn}
    canHit={canHit}
    onHit={onHit}
    onToggleHitMode={onToggleHitMode}
    isHitModeActive={hitMode}
    onSpread={handleSpread}
    onDrop={handleDropAction}
    canDrop={canDropBasedOnPoints}
    gameState={gameState || {}}
    setGameState={setGameState}
    onActionComplete={onActionComplete}
    className="mt-2 flex gap-2 justify-center"
  />
)}


      {penalties[position] > 0 && (
        <div className="text-red-400 text-xs mt-1">Penalized: {penalties[position]}</div>
      )}
    </div>
  );
};

PlayerSection.propTypes = {
  position: PropTypes.string.isRequired,
  player: PropTypes.object,
  hand: PropTypes.array,
  spreads: PropTypes.array,
  isCurrentTurn: PropTypes.bool,
  hasDrawnCard: PropTypes.bool,
  isHidden: PropTypes.bool,
  onDrop: PropTypes.func,
  hitMode: PropTypes.bool,
  selectedCard: PropTypes.number,
  onCardSelect: PropTypes.func,
  onHit: PropTypes.func,
  onToggleHitMode: PropTypes.func,
  onSpread: PropTypes.func,
  canHit: PropTypes.bool,
  canDrop: PropTypes.bool,
  gameState: PropTypes.object,
  setGameState: PropTypes.func,
  onActionComplete: PropTypes.func,
  onCardClick: PropTypes.func,
  className: PropTypes.string,
  playerIndex: PropTypes.number,
  isCurrentPlayer: PropTypes.bool,
  isSpectator: PropTypes.bool,
  showActions: PropTypes.bool,
  validHitSpreads: PropTypes.array
};

PlayerSection.defaultProps = {
  hand: [],
  spreads: [],
  isCurrentTurn: false,
  hasDrawnCard: false,
  isHidden: false,
  hitMode: false,
  canHit: false,
  canDrop: false,
  isSpectator: false,
  showActions: false,
  validHitSpreads: []
};

export default memo(PlayerSection);
