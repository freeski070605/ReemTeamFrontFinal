import { useState, useEffect, useCallback } from 'react';
import { 
    calculatePoints, 
    findBestSpread, 
    isValidSpread,
    canAddToSpread,
    findValidHitForAi,
    CARD_VALUES,
    handleGameEnd,
    handleStockEmpty 
} from '../utils/gameUtils';
import ChipSystem from '../utils/ChipSystem';

const useAiLogic = ({ gameState, setGameState }) => {
    const [aiProcessing, setAiProcessing] = useState(false);

    const evaluateAiDrop = useCallback((hand) => {
        const points = calculatePoints(hand);
        // AI will drop if it has very low points (strategic decision)
        return points <= 5;
    }, []);

    const handleAiDiscard = useCallback((hand, currentTurn) => {
        // First check if AI should drop
        if (evaluateAiDrop(hand)) {
            const points = gameState.playerHands.map(calculatePoints);
            const dropperPoints = points[currentTurn];
            const minPoints = Math.min(...points);
            const winners = points
                .map((points, index) => ({points, index}))
                .filter(({points}) => points === minPoints)
                .map(({index}) => index);
            
            const isCaught = dropperPoints > minPoints;
            
            setGameState(prev => ({
                ...prev,
                gameOver: true,
                winners,
                caught: isCaught,
                winType: isCaught ? 'DROP_CAUGHT' : 'DROP_WIN',
                dropped: currentTurn
            }));
            return;
        }

        // Regular discard logic
        const worstCardIndex = findWorstCardForAi(hand);
        const updatedHands = [...gameState.playerHands];
        const discardedCard = updatedHands[currentTurn].splice(worstCardIndex, 1)[0];
        
        // Check if this was the last card
        const isLastCard = updatedHands[currentTurn].length === 0;
        
        setGameState(prev => ({
            ...prev,
            playerHands: updatedHands,
            discardPile: [...prev.discardPile, discardedCard],
            hasDrawnCard: false,
            currentTurn: isLastCard ? currentTurn : (currentTurn + 1) % prev.players.length,
            gameOver: isLastCard,
            winner: isLastCard ? currentTurn : null,
            winType: isLastCard ? 'REGULAR_WIN' : null
        }));

        if (isLastCard) {
            handleGameEnd(gameState, [currentTurn], 'REGULAR_WIN');
        }
    }, [gameState, setGameState, evaluateAiDrop]);

    const handleAiTurn = useCallback(async () => {
        if (aiProcessing || !gameState.players[gameState.currentTurn]?.isAI) return;

        setAiProcessing(true);
        try {
            // Check for stock empty condition first
            if (gameState.deck.length === 0) {
                handleStockEmpty(gameState, setGameState);
                return;
            }

            // AI Draw Phase
            if (!gameState.hasDrawnCard) {
                await handleAiDraw(gameState, setGameState);
                return;
            }

            // AI Play Phase - Check for Reem possibility
            const aiHand = gameState.playerHands[gameState.currentTurn];
            const currentSpreads = gameState.playerSpreads[gameState.currentTurn];
            
            if (currentSpreads.length === 1) {
                const bestSpread = findBestSpread(aiHand);
                if (bestSpread) {
                    await handleAiSpread(bestSpread, gameState, setGameState);
                    // Check if this was a Reem
                    if (gameState.playerSpreads[gameState.currentTurn].length === 2) {
                        handleGameEnd(gameState, [gameState.currentTurn], 'REEM');
                        return;
                    }
                }
            } else {
                const bestSpread = findBestSpread(aiHand);
                if (bestSpread) {
                    await handleAiSpread(bestSpread, gameState, setGameState);
                }
            }

            // AI Discard Phase
            handleAiDiscard(aiHand, gameState.currentTurn);
            
        } finally {
            setAiProcessing(false);
        }
    }, [aiProcessing, gameState, handleAiDiscard]);

    useEffect(() => {
        if (gameState.players[gameState.currentTurn]?.isAI && !aiProcessing) {
            const timeoutId = setTimeout(handleAiTurn, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [gameState.currentTurn, handleAiTurn, aiProcessing]);

    return { aiProcessing };
};


const wouldImproveHand = (card, hand) => {
  const testHand = [...hand, card];
  
  // Check for same-rank sets
  const rankGroups = testHand.reduce((groups, c) => {
      groups[c.rank] = (groups[c.rank] || 0) + 1;
      return groups;
  }, {});
  
  if (Object.values(rankGroups).some(count => count >= 3)) {
      return true;
  }

  // Check for suited sequences
  const suitGroups = testHand.reduce((groups, c) => {
      groups[c.suit] = groups[c.suit] || [];
      groups[c.suit].push(c);
      return groups;
  }, {});

  for (const suitedCards of Object.values(suitGroups)) {
      if (suitedCards.length >= 3) {
          const ranks = 'ace234567JQK';
          const sortedCards = suitedCards.sort((a, b) => 
              ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
          );
          
          for (let i = 0; i <= sortedCards.length - 3; i++) {
              const sequence = sortedCards.slice(i, i + 3);
              const rankIndices = sequence.map(c => ranks.indexOf(c.rank));
              const isConsecutive = rankIndices.every((val, idx) => 
                  idx === 0 || val === rankIndices[idx - 1] + 1
              );
              
              if (isConsecutive) return true;
          }
      }
  }
  return false;
};

export const findWorstCardForAi = (hand) => {
  return hand.reduce((worst, card, index) => {
      const currentValue = CARD_VALUES[card.rank];
      if (currentValue > worst.value) {
          return { value: currentValue, index };
      }
      return worst;
  }, { value: -1, index: 0 }).index;
};

export const handleAiDraw = async (gameState, setGameState) => {
  const aiHand = gameState.playerHands[gameState.currentTurn];
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  if (topDiscard && wouldImproveAiHand(topDiscard, aiHand)) {
      handleAiDrawDiscard(gameState, setGameState);
  } else {
      handleAiDrawFromDeck(gameState, setGameState);
  }
};

export const wouldImproveAiHand = (card, hand) => {
    const testHand = [...hand, card];
  const bestSpread = findBestSpread(testHand);
  return bestSpread !== null;
};
export const handleAiDrawDiscard = (gameState, setGameState) => {
  const aiHand = gameState.playerHands[gameState.currentTurn];
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  const updatedHands = [...gameState.playerHands];
  updatedHands[gameState.currentTurn].push(topDiscard);

  setGameState(prev => ({
      ...prev,
      playerHands: updatedHands,
      hasDrawnCard: true
  }));
};
export const handleAiDrawFromDeck = (gameState, setGameState) => {
  const aiHand = gameState.playerHands[gameState.currentTurn];

  const updatedHands = [...gameState.playerHands];
  const drawnCard = gameState.deck.pop();
  updatedHands[gameState.currentTurn].push(drawnCard);

  setGameState(prev => ({
      ...prev,
      playerHands: updatedHands,
      hasDrawnCard: true
  }));
};


export const handleAiSpread = async (spread, gameState, setGameState) => {
  const updatedHands = [...gameState.playerHands];
  const updatedSpreads = [...gameState.playerSpreads];
  const currentTurn = gameState.currentTurn;

  spread.forEach(card => {
      const index = updatedHands[currentTurn].findIndex(c => 
          c.rank === card.rank && c.suit === card.suit
      );
      if (index !== -1) {
          updatedHands[currentTurn].splice(index, 1);
      }
  });

  updatedSpreads[currentTurn].push(spread);

  setGameState(prev => ({
      ...prev,
      playerHands: updatedHands,
      playerSpreads: updatedSpreads,
      gameOver: updatedHands[currentTurn].length === 0
  }));
};


const handleGameStateUpdate = (prevState, decision) => {
  switch (decision.action) {
      case 'DRAW_CARD':
          if (prevState.deck.length > 0) {
              const updatedDeck = [...prevState.deck];
              const drawnCard = updatedDeck.pop();
              const updatedHands = [...prevState.playerHands];
              updatedHands[prevState.currentTurn] = [...updatedHands[prevState.currentTurn], drawnCard];
              
              return {
                  ...prevState,
                  deck: updatedDeck,
                  playerHands: updatedHands,
                  hasDrawnCard: true
              };
          }
          return prevState;

      case 'DRAW_DISCARD':
          if (prevState.discardPile.length > 0) {
              const updatedDiscardPile = [...prevState.discardPile];
              const drawnCard = updatedDiscardPile.pop();
              const updatedHands = [...prevState.playerHands];
              updatedHands[prevState.currentTurn] = [...updatedHands[prevState.currentTurn], drawnCard];
              
              return {
                  ...prevState,
                  discardPile: updatedDiscardPile,
                  playerHands: updatedHands,
                  hasDrawnCard: true
              };
          }
          return prevState;

      case 'DISCARD':
          const discardHands = [...prevState.playerHands];
          const discardedCard = discardHands[prevState.currentTurn].splice(decision.payload.cardIndex, 1)[0];
          
          return {
              ...prevState,
              playerHands: discardHands,
              discardPile: [...prevState.discardPile, discardedCard],
              hasDrawnCard: false,
              currentTurn: (prevState.currentTurn + 1) % prevState.players.length
          };

      default:
          return prevState;
  }
};

export default useAiLogic;
