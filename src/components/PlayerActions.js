import React, { useMemo } from 'react';
import {
  isValidSpread,
  findBestSpread,
  handleDrop,
  isValidHit
} from '../utils/gameUtils';

const PlayerActions = ({
  gameState,
  setGameState,
  isActive,
  hasDrawnCard,
  canDrop,
  onActionComplete,
  onSpread,
  onHit,
  onToggleHitMode,
  isHitModeActive
}) => {
  // Check if player can spread
  const canSpread = useMemo(() => {
    if (!isActive || !hasDrawnCard) return false;
    const hand = gameState.playerHands[gameState.currentTurn];
    const bestSpread = findBestSpread(hand);
    return bestSpread !== null && isValidSpread(bestSpread);
  }, [isActive, hasDrawnCard, gameState]);

  // Check if player can hit
  const canHit = useMemo(() => {
    if (!isActive || !hasDrawnCard) return false;
    const currentHand = gameState.playerHands[gameState.currentTurn];
    return gameState.playerSpreads.some(playerSpread =>
      playerSpread.some(spread =>
        currentHand.some(card => isValidHit(card, spread))
      )
    );
  }, [isActive, hasDrawnCard, gameState]);

  // Spread action handler
  const handleSpreadAction = (e) => {
    e.preventDefault();
    if (gameState.isProcessingAction) return;

    if (isActive && canSpread) {
      const hand = gameState.playerHands[gameState.currentTurn];
      const spreadToMake = findBestSpread(hand);
      if (spreadToMake) onSpread(spreadToMake);
    }
  };

  // Drop action handler
  const handleDropAction = (e) => {
    e.preventDefault();
    if (isActive && canDrop && !hasDrawnCard) {
      handleDrop(gameState, setGameState);
      onActionComplete?.('DROP');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-yellow-400 p-3 shadow-md z-50 flex justify-center gap-3">
      {/* Drop Button */}
      <button
        className={`flex-1 px-4 py-2 rounded-md font-bold text-sm transition-colors duration-200
                    ${!hasDrawnCard && canDrop && gameState.players[gameState.currentTurn]?.hitPenaltyRounds === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}`}
        disabled={!isActive || hasDrawnCard || !canDrop || gameState.players[gameState.currentTurn]?.hitPenaltyRounds > 0}
        onClick={handleDropAction}
      >
        Drop
      </button>

      {/* Spread Button */}
      <button
        className={`flex-1 px-4 py-2 rounded-md font-bold text-sm transition-colors duration-200
                    ${hasDrawnCard && canSpread && !gameState.isProcessingAction
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}`}
        disabled={!canSpread || gameState.isProcessingAction}
        onClick={handleSpreadAction}
      >
        {gameState.isProcessingAction ? 'Processing...' : 'Spread'}
      </button>

      {/* Hit Button */}
      <button
        className={`flex-1 px-4 py-2 rounded-md font-bold text-sm transition-colors duration-200
                    ${isHitModeActive
                      ? 'bg-yellow-400 text-black'
                      : canHit
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'}`}
        onClick={onToggleHitMode}
        disabled={!isActive || !hasDrawnCard || !canHit}
      >
        Hit
      </button>
    </div>
  );
};

export default PlayerActions;
