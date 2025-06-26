import { useCallback } from 'react';
import ChipSystem from '../utils/ChipSystem';
import { 
  handleDrawCard,
  handleDrawDiscard,
  handleSpread,
  handleHit,
  handleDiscard,
  handleDrop,
  isValidSpread,
  calculatePoints,
  handleGameEnd,
  handleStockEmpty,
  shuffleDeck,
  dealHands,
  INITIAL_DECK,
  isValidHit,
} from '../utils/gameUtils';

export const useGameLogic = (gameState, setGameState) => {
    // Add new win conditions
const WIN_TYPES = {
    REEM: 'REEM',           // Double stake from each player
    DROP_WIN: 'DROP_WIN',   // Single stake from each player
    DROP_CAUGHT: 'DROP_CAUGHT', // Double stake penalty to dropper
    REGULAR_WIN: 'REGULAR_WIN', // Single stake from each player
    STOCK_EMPTY: 'STOCK_EMPTY', // Single stake or tie
  };
  
  const handleRestart = useCallback(async (players) => {
    const newState = {
      players,
      deck: shuffleDeck([...INITIAL_DECK]),
      playerHands: dealHands(shuffleDeck([...INITIAL_DECK]), players.length),
      playerSpreads: Array(players.length).fill().map(() => []),
      currentTurn: 0,
      hasDrawnCard: false,
      gameStarted: true,
      gameOver: false,
      stake: gameState.stake,
      pot: gameState.stake * players.length
    };
    
    await ChipSystem.handleGameStart(newState);
    setGameState(newState);
    return newState;
  }, [setGameState, gameState.stake]);

  const handlePlayerAction = useCallback((actionType, payload) => {
    switch(actionType) {
      case 'DRAW_CARD':
        if (!gameState.hasDrawnCard && gameState.deck.length > 0) {
          handleDrawCard(gameState.currentTurn, gameState.playerHands, gameState.deck, false, 
            (newHands) => setGameState(prev => ({...prev, playerHands: newHands, hasDrawnCard: true})),
            (newDeck) => setGameState(prev => ({...prev, deck: newDeck}))
          );
        } else if (gameState.deck.length === 0) {
          handleStockEmpty(gameState, setGameState);
        }
        break;

      case 'DRAW_DISCARD':
        if (!gameState.hasDrawnCard && gameState.discardPile.length > 0) {
          handleDrawDiscard(gameState, setGameState);
        }
        break;

      case 'SPREAD':
        if (gameState.hasDrawnCard && isValidSpread(payload.cards)) {
          handleSpread(gameState, setGameState, payload.cards);
          const isReem = gameState.playerSpreads[gameState.currentTurn]?.length === 2;
          if (isReem) {
            ChipSystem.handleGameEnd(gameState, [gameState.currentTurn], 'REEM');
          }
        }
        break;

      case 'HIT':
        const hitResult = handleHit(gameState, payload.cardIndex, payload.targetIndex, payload.spreadIndex);
        if (hitResult) {
          setGameState(prev => ({...prev, ...hitResult}));
          if (hitResult.playerHands[gameState.currentTurn].length === 0) {
            ChipSystem.handleGameEnd(gameState, [gameState.currentTurn], 'REGULAR_WIN');
          }
        }
        break;
        case 'DROP':
            if (!gameState.hasDrawnCard) {
              const points = gameState.playerHands.map(calculatePoints);
              const dropperPoints = points[gameState.currentTurn];
              const minPoints = Math.min(...points);
              
              // Find all players with minimum points
              const winners = points
                .map((points, index) => ({points, index}))
                .filter(({points}) => points === minPoints)
                .map(({index}) => index);
              
              const isCaught = dropperPoints > minPoints;
              const isTieWithDropper = winners.includes(gameState.currentTurn) && winners.length > 1;
          
              if (isTieWithDropper) {
                // Dropper pays double, other player is sole winner
                const otherWinner = winners.find(index => index !== gameState.currentTurn);
                ChipSystem.handleGameEnd(gameState, [otherWinner], 'DROP_CAUGHT');
              } else if (isCaught) {
                // Dropper pays double to each winner
                ChipSystem.handleGameEnd(gameState, winners, 'DROP_CAUGHT');
              } else {
                // Normal drop win
                ChipSystem.handleGameEnd(gameState, winners, 'DROP_WIN');
              }
              
              setGameState(prev => ({
                ...prev,
                gameOver: true,
                winners,
                caught: isCaught,
                winType: isCaught ? 'DROP_CAUGHT' : 'DROP_WIN',
                dropped: gameState.currentTurn
              }));
            }
            break;

      case 'DISCARD':
        if (gameState.hasDrawnCard) {
          handleDiscard(gameState, setGameState, payload.cardIndex);
        }
        break;

      case 'STOCK_EMPTY':
        const { winners, scores } = payload;
        ChipSystem.handleGameEnd(gameState, winners, 'STOCK_EMPTY');
        setGameState(prev => ({
          ...prev,
          gameOver: true,
          winners,
          roundScores: scores,
          winType: 'STOCK_EMPTY'
        }));
        break;
    }
  }, [gameState, setGameState]);

  const handleGameStart = useCallback(async () => {
    const success = await ChipSystem.handleGameStart(gameState);
    if (success) {
      setGameState(prev => ({...prev, gameStarted: true}));
    }
  }, [gameState, setGameState]);

  return { handlePlayerAction, handleRestart, handleGameStart };
};
