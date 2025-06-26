import axios from 'axios';
import ChipSystem from './ChipSystem';

// Game Constants
export const CARD_VALUES = {
  'ace': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
  '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10
};

// Debug logging to verify card counts
const logDeckStats = (deck) => {
  console.log('Total cards:', deck.length);
  const rankCounts = {};
  deck.forEach(card => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  console.log('Cards per rank:', rankCounts);
};

// Correct deck initialization
export const INITIAL_DECK = [
  // Non-face cards (Ace through 7)
  ...'ace,2,3,4,5,6,7'.split(',').flatMap(rank =>
      ['Hearts', 'Diamonds', 'Clubs', 'Spades'].map(suit => ({rank, suit}))
  ),
  // Face cards (J,Q,K)
  ...'J,Q,K'.split(',').flatMap(rank =>
      ['Hearts', 'Diamonds', 'Clubs', 'Spades'].map(suit => ({rank, suit}))
  )
];

// Verify deck composition
logDeckStats(INITIAL_DECK);



// Core Game Functions
// Add a helper function to create a unique card identifier
const getCardId = (card) => `${card.rank}_${card.suit}`;

// Add card tracking to shuffleDeck
export const shuffleDeck = (deck) => {
    const seenCards = new Set();
    const validDeck = deck.filter(card => {
        const cardId = getCardId(card);
        if (seenCards.has(cardId)) return false;
        seenCards.add(cardId);
        return true;
    });
    
    const shuffled = [...validDeck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Add verification in dealHands
export const dealHands = (deck, playerCount) => {
    const seenCards = new Set();
    console.log('Pre-deal deck size:', deck.length);
    const hands = Array(playerCount).fill().map(() => []);
    const totalCardsToDeal = playerCount * 5;
    
    for (let i = 0; i < totalCardsToDeal; i++) {
        const playerIndex = i % playerCount;
        if (deck.length > 0) {
            const card = deck.pop();
            const cardId = getCardId(card);
            if (!seenCards.has(cardId)) {
                seenCards.add(cardId);
                hands[playerIndex].push(card);
            }
        }
    }
    
    console.log('Post-deal deck size:', deck.length);
    return hands;
};





export const calculatePoints = (hand) => {
  return hand.reduce((total, card) => total + (CARD_VALUES[card.rank] || 0), 0);
};


// Spread Validation Functions
export const isValidSpread = (cards) => {
  if (!Array.isArray(cards) || cards.length < 3) return false;

  // Same rank check (3 or 4 of a kind)
  const sameRank = cards.every(card => card.rank === cards[0].rank);
  if (sameRank) return true;

  // Suited sequence check
  if (cards.every(card => card.suit === cards[0].suit)) {
      const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K']; // Define rank order
      const sortedCards = [...cards].sort((a, b) => 
          ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
      );

      // Check if the sequence is consecutive
      for (let i = 1; i < sortedCards.length; i++) {
          const currentRankIndex = ranks.indexOf(sortedCards[i].rank);
          const prevRankIndex = ranks.indexOf(sortedCards[i - 1].rank);
          if (currentRankIndex !== prevRankIndex + 1) return false;
      }
      return true;
  }

  return false;
};





// Game Action Handlers
export const handleDrawCard = (currentTurn, playerHands, deck, hasDrawnCard, setPlayerHands, setDeck) => {
  
  console.log('Draw card called with:', { currentTurn, deck: deck?.length, hands: playerHands?.length });
  
  // Early validation with detailed logging
  if (!Array.isArray(deck) || !Array.isArray(playerHands)) {
      console.log('Current state:', { deck, playerHands });
      return;
  }

  if (!hasDrawnCard) {
    if (deck.length === 0) {
        return false; // Indicate draw was not possible
    }
      const updatedDeck = [...deck];
      const drawnCard = updatedDeck.pop();
      
      const updatedHands = playerHands.map((hand, index) => 
          index === currentTurn ? [...hand, drawnCard] : hand
      );
      
      console.log('Drawing successful:', {
          drawnCard,
          newHandSize: updatedHands[currentTurn].length,
          remainingDeck: updatedDeck.length
      });

      setPlayerHands(updatedHands);
      setDeck(updatedDeck);
      return true; // Indicate draw was successful
  }
  return false; // Indicate draw was not possible
};

export const isDeckEmpty = (deck) => {
  return !deck || deck.length === 0;
};



export const handleDrawDiscard = (gameState, setGameState) => {
  if (gameState.hasDrawnCard || gameState.gameOver || !gameState.discardPile.length) return;

  const updatedDiscardPile = [...gameState.discardPile];
  const drawnCard = updatedDiscardPile.pop();
  const updatedHands = [...gameState.playerHands];
  updatedHands[gameState.currentTurn] = [...updatedHands[gameState.currentTurn], drawnCard];

  setGameState(prev => ({
    ...prev,
    discardPile: updatedDiscardPile,
    playerHands: updatedHands,
    hasDrawnCard: true
  }));
};

export const handleSpread = (gameState, setGameState, selectedCards, advanceTurn = false) => {
  const { currentTurn, playerHands, playerSpreads } = gameState;
  
  // Validate spread immediately
  if (!isValidSpread(selectedCards)) return;

  // Create new state objects to avoid mutation
  const updatedHands = [...playerHands];
  const updatedSpreads = [...playerSpreads];
  
  // Initialize spreads array if needed
  if (!updatedSpreads[currentTurn]) {
    updatedSpreads[currentTurn] = [];
  }

  // Add spread immediately
  updatedSpreads[currentTurn].push([...selectedCards]);

  // Remove cards from hand
  selectedCards.forEach(card => {
    const cardIndex = updatedHands[currentTurn].findIndex(c => 
      c.rank === card.rank && c.suit === card.suit
    );
    if (cardIndex !== -1) {
      updatedHands[currentTurn].splice(cardIndex, 1);
    }
  });

  // Check for Reem condition
  const isReem = updatedSpreads[currentTurn].length === 2;

  // Update state in one operation
  setGameState(prev => ({
    ...prev,
    playerHands: updatedHands,
    playerSpreads: updatedSpreads,
    hasDrawnCard: true,
    gameOver: isReem,
    winner: isReem ? currentTurn : null,
    winType: isReem ? 'REEM' : null
  }));
};


export const findBestSpread = (hand) => {
  // Group cards by rank
  const rankGroups = hand.reduce((groups, card) => {
      groups[card.rank] = groups[card.rank] || [];
      groups[card.rank].push(card);
      return groups;
  }, {});

  // Log the groups for debugging
  console.log('Rank groups:', rankGroups);

  // Check for 3 or 4 of a kind
  for (let rank in rankGroups) {
      if (rankGroups[rank].length >= 3) {
          console.log(`Found ${rankGroups[rank].length} of a kind:`, rankGroups[rank]);
          return rankGroups[rank].slice(0, 3); // Return exactly 3 cards
      }
  }

  // Group cards by suit for sequence checking
  const suitGroups = hand.reduce((groups, card) => {
      groups[card.suit] = groups[card.suit] || [];
      groups[card.suit].push(card);
      return groups;
  }, {});

  const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
  
  // Check each suit group for sequences
  for (let suit in suitGroups) {
      if (suitGroups[suit].length >= 3) {
          const sortedCards = suitGroups[suit].sort((a, b) => 
              ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
          );
          
          // Find any valid sequence of 3
          for (let i = 0; i <= sortedCards.length - 3; i++) {
              const possibleSequence = sortedCards.slice(i, i + 3);
              if (isValidSpread(possibleSequence)) {
                  console.log('Found sequence:', possibleSequence);
                  return possibleSequence;
              }
          }
      }
  }

  return null;
};



export const handleDrop = (gameState, setGameState) => {
    // Calculate points for all players
    const points = gameState.playerHands.map(calculatePoints);
    const minPoints = Math.min(...points);
    const dropperPoints = points[gameState.currentTurn];
    
    // Find winners (players with minimum points)
    const winners = points
        .map((points, index) => ({points, index}))
        .filter(({points}) => points === minPoints)
        .map(({index}) => index);

    const isCaught = dropperPoints > minPoints;
    const isTied = winners.length > 1;
    
    // Update game state with drop results
    setGameState(prev => ({
        ...prev,
        gameOver: true,
        winners,
        caught: isCaught,
        doubleStake: isCaught,
        isTied,
        winType: 'DROP',
        dropped: gameState.currentTurn
    }));
};


export const handleDiscard = (gameState, setGameState, cardIndex) => {
  console.log('Handling discard:', { gameState, cardIndex });

  if (!gameState.hasDrawnCard || cardIndex < 0) {
    console.log('Cannot discard: hasDrawnCard:', gameState.hasDrawnCard, 'cardIndex:', cardIndex);
    return;
  }

  const updatedHands = [...gameState.playerHands];
  const discardedCard = updatedHands[gameState.currentTurn].splice(cardIndex, 1)[0];
  console.log('Discarded card:', discardedCard);

  // Check if the player has emptied their hand (win condition)
  const isOut = updatedHands[gameState.currentTurn].length === 0;

  // Update game state
  setGameState(prev => ({
    ...prev,
    playerHands: updatedHands,
    discardPile: [...prev.discardPile, discardedCard],
    hasDrawnCard: false,
    requiresDiscard: false, // Reset discard requirement
    currentTurn: isOut ? prev.currentTurn : (prev.currentTurn + 1) % prev.players.length, // Advance turn if not a win
    gameOver: isOut,
    winner: isOut ? gameState.currentTurn : null,
    winType: isOut ? 'REGULAR_WIN' : null,
  }));

  // If the player wins, handle the game end
  if (isOut) {
    handleGameEnd(gameState, [gameState.currentTurn], 'REGULAR_WIN');
  }

  // Check if the deck is empty after discarding
  if (gameState.deck.length === 0) {
    handleStockEmpty(gameState, setGameState);
  }
};



export const handleStockEmpty = (gameState, setGameState) => {
  // Check if the deck is empty and the player has already drawn a card
  if (gameState.deck.length === 0 && gameState.hasDrawnCard) {
    const points = gameState.playerHands.map(calculatePoints);
    const minPoints = Math.min(...points);
    const winners = points
      .map((points, index) => ({points, index}))
      .filter(({points}) => points === minPoints)
      .map(({index}) => index);

    // Handle chip distribution for stock empty condition
    ChipSystem.handleGameEnd(gameState, winners, 'STOCK_EMPTY');

    setGameState(prev => ({
      ...prev,
      gameOver: true,
      winners,
      winType: 'STOCK_EMPTY',
      isTied: winners.length > 1
    }));
  } else if (gameState.deck.length === 0 && !gameState.hasDrawnCard) {
    // If the deck is empty but the player hasn't drawn a card, allow them to discard
    setGameState(prev => ({
      ...prev,
      requiresDiscard: true // Flag to indicate the player must discard
    }));
  }
};


export const handleAddToSpread = (gameState, setGameState, cardIndex, targetPlayer, spreadIndex) => {
  const card = gameState.playerHands[gameState.currentTurn][cardIndex];
  const targetSpread = gameState.playerSpreads[targetPlayer][spreadIndex];

  if (!canAddToSpread(card, targetSpread)) return;

  const updatedHands = [...gameState.playerHands];
  const updatedSpreads = [...gameState.playerSpreads];
  
  updatedHands[gameState.currentTurn].splice(cardIndex, 1);
  updatedSpreads[targetPlayer][spreadIndex].push(card);

  setGameState(prev => ({
    ...prev,
    playerHands: updatedHands,
    playerSpreads: updatedSpreads,
    gameOver: updatedHands[gameState.currentTurn].length === 0,
    winner: updatedHands[gameState.currentTurn].length === 0 ? gameState.currentTurn : null
  }));
};

// Add these exports to gameUtils.js
export const findValidHitForAi = (hand, spreads, playerIndex) => {
  if (!hand || !spreads) return null;
  
  // Ensure spreads is always an array
  const allSpreads = Array.isArray(spreads) ? spreads : [];
  
  for (let cardIndex = 0; cardIndex < hand.length; cardIndex++) {
    for (let spreadIndex = 0; spreadIndex < allSpreads.length; spreadIndex++) {
      const spread = allSpreads[spreadIndex];
      if (spread && isValidHit(hand[cardIndex], spread)) {
        return {
          cardIndex,
          spreadIndex,
          targetIndex: playerIndex
        };
      }
    }
  }
  return null;
};



// ✅ CORRECTED isValidHit function (Excluding 8, 9, 10, Ace high)
export const isValidHit = (card, spread) => {
  console.log('isValidHit (frontend) called with:', { card, spread }); // <-- Add this log

  // A hit must be on an existing spread of at least 3 cards
  if (!Array.isArray(spread) || spread.length < 3) {
      console.log('isValidHit (frontend): Spread is not array or too short', spread);
      return false;
  }

  // The card being hit with must be a valid card object
  if (!card || typeof card.rank !== 'string' || typeof card.suit !== 'string') {
      console.log('isValidHit (frontend): Invalid card object', card);
      return false;
  }

  // Card values, excluding 8, 9, 10
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, J: 11, Q: 12,
    K: 13, ace: 1 // Ace value is 1 for sorting
  };

  // Check if it's a same-rank spread
  const isSameRankSpread = spread.every(c => c.rank === spread[0].rank);
  if (isSameRankSpread) {
      // If it's a same-rank spread, the hit card must match the rank
      if (card.rank === spread[0].rank) {
          console.log('isValidHit (frontend): Valid hit on same-rank spread');
          return true;
      } else {
          console.log('isValidHit (frontend): Invalid rank for same-rank hit');
          return false;
      }
  }

  // Check if it's a suited sequence spread
  const isSuitedSequenceSpread = spread.every(c => c.suit === spread[0].suit);

  if (isSuitedSequenceSpread) {
      // If it's a suited sequence spread, the hit card must match the suit
      if (card.suit !== spread[0].suit) {
          console.log('isValidHit (frontend): Invalid suit for suited sequence hit'); // <-- This log matches your backend log
          return false;
      }

      // Collect all ranks (spread + hit card) and map to values
      const allRanks = [...spread.map(c => c.rank), card.rank];
      const allValues = allRanks.map(rank => values[rank]).sort((a, b) => a - b);

      console.log('isValidHit (frontend): Checking suited sequence with values:', allValues); // <-- Add this log

      // Check for standard consecutive sequence (e.g., 2, 3, 4, 5)
      let isSequence = true;
      for (let i = 1; i < allValues.length; i++) {
          if (allValues[i] !== allValues[i - 1] + 1) {
              isSequence = false;
              break;
          }
      }

      if (isSequence) {
           console.log('isValidHit (frontend): Valid hit on suited sequence (standard)');
           return true;
      }

       // Check for Ace low sequence (A, 2, 3, 4, 5)
      // When sorted, values would be [1, 2, 3, 4, 5]
       if (allValues.length === 5 && allValues[0] === 1 && allValues[1] === 2 && allValues[2] === 3 && allValues[3] === 4 && allValues[4] === 5) {
           console.log('isValidHit (frontend): Valid hit on suited sequence (Ace low)');
           return true;
      }

      // If it's a suited sequence but doesn't form a valid standard or Ace-low sequence
      console.log('isValidHit (frontend): Invalid rank sequence for suited sequence hit', allValues);
      return false;

  }

  // If it's neither a same-rank nor a suited sequence spread, it's not a valid target
  console.log('isValidHit (frontend): Spread is neither same-rank nor suited sequence');
  return false;

};







// Helper function to check if two ranks are consecutive
const isConsecutive = (rank1, rank2) => {
  const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
  const index1 = ranks.indexOf(rank1);
  const index2 = ranks.indexOf(rank2);
  return Math.abs(index1 - index2) === 1;
};


export const canAddToSpread = (card, spread) => {
  if (!card || !spread || spread.length === 0) return false;

  // Check if the spread is a set (all cards have the same rank)
  const isSet = spread.every(c => c.rank === spread[0].rank);
  if (isSet) {
    return card.rank === spread[0].rank; // Card must match the set's rank
  }

  // Check if the spread is a sequence (cards are in consecutive order)
  const isSequence = spread.every((c, i) => {
    if (i === 0) return true;
    const prevRank = spread[i - 1].rank;
    const currRank = c.rank;
    return isConsecutive(prevRank, currRank);
  });

  if (isSequence) {
    // Check if the card extends the sequence
    const firstRank = spread[0].rank;
    const lastRank = spread[spread.length - 1].rank;

    // Card must be one rank below the first card or one rank above the last card
    return (
      isConsecutive(card.rank, firstRank) || isConsecutive(lastRank, card.rank)
    );
  }

  return false;
};






export const isBeneficialCard = (card, hand) => {
  const rankFrequency = hand.filter(c => c.rank === card.rank).length;
  return rankFrequency >= 2;
};

export const findLeastValuableCard = (hand) => {
  return hand.reduce((lowest, card, index) => {
    const currentValue = CARD_VALUES[card.rank];
    if (currentValue < lowest.value) {
      return { value: currentValue, index };
    }
    return lowest;
  }, { value: Infinity, index: -1 }).index;
};

export const shouldAiDrop = (hand) => {
  const points = calculatePoints(hand);
  return points <= 10;
};

export const findValidHitTarget = (card, gameState) => {
  // Scan all spreads to find valid hit targets
  for (let playerIndex = 0; playerIndex < gameState.playerSpreads.length; playerIndex++) {
      const playerSpread = gameState.playerSpreads[playerIndex];
      for (let spreadIndex = 0; spreadIndex < playerSpread.length; spreadIndex++) {
          if (isValidHit(card, playerSpread[spreadIndex])) {
              return {
                  targetIndex: playerIndex,
                  spreadIndex: spreadIndex
              };
          }
      }
  }
  return null;
};


// Add this function to handle hit logic
export const handleHit = (gameState, cardIndex, targetIndex, spreadIndex) => {
  // Add defensive checks
  if (!gameState?.playerHands?.[gameState.currentTurn]) {
      console.log('Invalid hand access:', {
          hands: gameState?.playerHands,
          currentTurn: gameState?.currentTurn
      });
      return null;
  }

  if (!gameState?.playerSpreads?.[targetIndex]?.[spreadIndex]) {
      console.log('Invalid spread access:', {
          spreads: gameState?.playerSpreads,
          targetIndex,
          spreadIndex
      });
      return null;
  }

  const currentTurn = gameState.currentTurn;
  const card = gameState.playerHands[currentTurn][cardIndex];
  const targetSpread = gameState.playerSpreads[targetIndex][spreadIndex];

  console.log('Hit attempt:', {
      card,
      targetSpread,
      currentTurn,
      targetIndex,
      spreadIndex
  });

  if (!isValidHit(card, targetSpread)) {
      console.log('Invalid hit');
      return null;
  }

  // Create immutable state updates
  const updatedHands = gameState.playerHands.map((hand, idx) => 
      idx === currentTurn ? 
          hand.filter((_, i) => i !== cardIndex) : 
          [...hand]
  );

  const updatedSpreads = gameState.playerSpreads.map((playerSpread, idx) => 
      idx === targetIndex ?
          playerSpread.map((spread, sIdx) =>
              sIdx === spreadIndex ?
                  [...spread, card] :
                  [...spread]
          ) :
          [...playerSpread]
  );

  return {
      playerHands: updatedHands,
      playerSpreads: updatedSpreads,
      hasDrawnCard: true,
      requiresDiscard: true
  };
};












export const handleAiStateUpdate = (prevState, decision) => {
  switch (decision.type) {
      case 'DRAW':
          return handleAiDraw(prevState, decision);
      case 'PLAY':
          return handleAiPlay(prevState, decision);
      case 'DISCARD':
          return handleAiDiscard(prevState, decision);
      default:
          return prevState;
  }
};

export const handleAiDraw = (prevState, decision) => {
  if (decision.source === 'DISCARD') {
      return handleDrawDiscard(prevState);
  }
  return handleDrawCard(prevState);
};

export const handleAiPlay = (prevState, decision) => {
  if (decision.action === 'SPREAD') {
      return handleSpread(decision.cards, prevState.currentTurn, prevState);
  } else if (decision.action === 'HIT') {
      return handleHit(
          decision.cardIndex,
          decision.targetIndex,
          decision.spreadIndex,
          prevState
      );
  }
  return prevState;
};

export const handleAiDiscard = (prevState, decision) => {
  return handleDiscard(prevState, decision.cardIndex);
};



export const handleNewGame = (players, stake) => {
  const newDeck = shuffleDeck([...INITIAL_DECK]);
  const initialHands = dealHands(newDeck, players.length);
  
  return {
    players,
    deck: newDeck,
    playerHands: initialHands,
    playerSpreads: Array(players.length).fill().map(() => []),
    discardPile: [],
    currentTurn: 0,
    hasDrawnCard: false,
    gameStarted: true,
    gameOver: false,
    stake: stake,
    pot: stake * players.length,
    roundScores: calculatePoints(initialHands),
    winners: [],
    winType: null,
    timestamp: Date.now(),
    isInitialized: true
  };
};


export const updateRoundScores = (playerHands) => {
  return playerHands.map(hand => calculatePoints(hand));
};

export const handleGameEnd = (gameState) => {
  // Validate gameState object
  if (!gameState || !gameState.playerHands || !Array.isArray(gameState.playerHands)) {
      console.error('Invalid game state:', gameState);
      return {
          gameOver: true,
          winners: [],
          winType: null,
          isTied: false
      };
  }

  const finalScores = updateRoundScores(gameState.playerHands);
  const currentPlayer = gameState.currentTurn;
  const points = gameState.playerHands.map(hand => 
      Array.isArray(hand) ? calculatePoints(hand) : 0
  );
  
  // Different win conditions with null checks
  const isReem = gameState.playerSpreads?.[currentPlayer]?.length === 2;
  const isOutOfCards = gameState.playerHands?.[currentPlayer]?.length === 0;
  const isStockEmpty = gameState.deck?.length === 0;
  
  const minPoints = Math.min(...points);
  const winners = points
      .map((points, index) => ({points, index}))
      .filter(({points}) => points === minPoints)
      .map(({index}) => index);
      
  return {
      roundScores: finalScores,
      gameOver: true,
      winners,
      winType: isReem ? 'REEM' : 
               isOutOfCards ? 'REGULAR_WIN' : 
               gameState.dropped ? (winners.includes(gameState.dropped) ? 'DROP_WIN' : 'DROP_CAUGHT') :
               isStockEmpty ? 'STOCK_EMPTY' : null,
      isTied: winners.length > 1
  };
};

// Add to gameUtils.js
export const calculateStateHash = (gameState) => {
  if (!gameState) return '';
  
  try {
    // Create a simplified version of the state for hashing
    const stateForHashing = {
      players: gameState.players?.map(p => p.username) || [],
      hands: gameState.playerHands?.map(hand => 
        hand.map(card => `${card.rank}_${card.suit}`).sort()
      ) || [],
      spreads: gameState.playerSpreads || [],
      currentTurn: gameState.currentTurn,
      deckSize: gameState.deck?.length || 0,
      discardSize: gameState.discardPile?.length || 0,
      gameOver: gameState.gameOver,
      timestamp: gameState.timestamp
    };
    
    // Create a hash from the state
    return JSON.stringify(stateForHashing)
      .split('')
      .reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
      }, 0)
      .toString(36);
  } catch (error) {
    console.error('Error calculating state hash:', error);
    return '';
  }
};


// Add to gameUtils.js
// Request state validation from the server
export const requestStateValidation = async (tableId, gameState) => {
  try {
    const response = await fetch(`/api/tables/${tableId}/validate-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        stateHash: calculateStateHash(gameState),
        timestamp: Date.now()
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('State validation request failed:', error);
    return { valid: false, error: error.message };
  }
};



