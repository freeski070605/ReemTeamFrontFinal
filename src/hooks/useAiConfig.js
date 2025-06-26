import { useMemo } from 'react';

export const useAiConfig = (gameState, handlers) => {
  const {
    playerHands,
    currentTurn,
    discardPile,
    deck,
    players,
    stake,
    hasDrawnCard,
    gameOver
  } = gameState;

  const {
    setPlayerHands,
    setDeck,
    setDiscardPile,
    nextTurn,
    setHasDrawnCard,
    handleGameEnd
  } = handlers;

  return useMemo(() => ({
    playerHands,
    currentTurn,
    discardPile,
    deck,
    setPlayerHands,
    setDeck,
    setDiscardPile,
    setCurrentTurn: nextTurn,
    handleSpread: handlers.handleSpread,
    handleHit: handlers.handleHit,
    handleDrop: handlers.handleDrop,
    findValidHitForAi: handlers.findValidHitForAi,
    isBeneficialCard: handlers.isBeneficialCard,
    findLeastValuableCard: handlers.findLeastValuableCard,
    shouldAiDrop: handlers.shouldAiDrop,
    setHasDrawnCard,
    setForceRender: () => {},
    players,
    stake,
    handleGameEnd,
    hasDrawnCard,
    isValidSpread: handlers.isValidSpread,
    gameOver
  }), [
    playerHands,
    currentTurn,
    discardPile,
    deck,
    players,
    stake,
    hasDrawnCard,
    gameOver,
    nextTurn,
    handlers
  ]);
};
