import React, { useMemo, useEffect, useCallback, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SocketContext } from '../components/SocketContext';
import { useGameSocket } from '../hooks/useGameSocket';
import useGameState from '../hooks/useGameState';
import { PLAYER_POSITIONS, CARD_VALUES } from './gameConstants';
import {
  isValidSpread,
  INITIAL_DECK,
  shuffleDeck,
  dealHands
} from '../utils/gameUtils';

import PlayerSection from './PlayerSection';
import CenterGameArea from './CenterGameArea';
import GameEndOverlay from './GameEndOverlay';
import { LoadingState } from './LoadingState';
import { GameErrorBoundary } from './GameErrorBoundary';
import ChipSystem from '../utils/ChipSystem';



const GameBoard = ({ tableId, gameState, setGameState, user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [hitMode, setHitMode] = useState(false);
    const { socket } = useContext(SocketContext); // ✅ context-based socket

  
  // ✅ Use useMemo for isSpectator to react to gameState.players and user changes
  const isSpectator = useMemo(() => {
      console.log('Calculating isSpectator:', {
          gameStatePlayers: gameState?.players?.map(p => p?.username),
          currentUser: user?.username,        
          timestamp: gameState?.timestamp // ✅ Add timestamp to force recalculation
      });
  
      // Safeguard against missing players array
      if (!gameState?.players || !Array.isArray(gameState.players)) {
          console.log('GameBoard: No players array, assuming spectator');
          return true;
      }
  
      const isSpec = !gameState.players.some(p => p?.username === user?.username);
      console.log('GameBoard: isSpectator result:', isSpec);
      return isSpec;
  }, [gameState?.players, user?.username, gameState?.timestamp]); // ✅ Add timestamp dependency
  
  // Pass gameState and setGameState to useGameSocket
  useGameSocket(socket, tableId, user, gameState, setGameState);
  
  
    // Enhanced player positioning logic
    const getOptimalPlayerPositions = useMemo(() => {
      const totalPlayers = gameState.players.length;
      const currentPlayerIndex = gameState.players.findIndex(p => p.username === user?.username);
  
      // Define position layouts for different player counts
      const positionLayouts = {
        2: ['bottom', 'top'],
        3: ['bottom', 'left', 'right'],
        4: ['bottom', 'left', 'top', 'right']
      };
  
      const positions = positionLayouts[totalPlayers] || positionLayouts[4];
  
      // Reorder so current player is always at bottom
      if (currentPlayerIndex !== -1) {
        const reorderedPlayers = [
          ...gameState.players.slice(currentPlayerIndex),
          ...gameState.players.slice(0, currentPlayerIndex)
        ];
  
        const reorderedHands = [
          ...gameState.playerHands.slice(currentPlayerIndex),
          ...gameState.playerHands.slice(0, currentPlayerIndex)
        ];
  
        const reorderedSpreads = [
          ...gameState.playerSpreads.slice(currentPlayerIndex),
          ...gameState.playerSpreads.slice(0, currentPlayerIndex)
        ];
  
        return {
          players: reorderedPlayers,
          hands: reorderedHands,
          spreads: reorderedSpreads,
          positions,
          adjustedCurrentTurn: (gameState.currentTurn - currentPlayerIndex + totalPlayers) % totalPlayers,
          currentPlayerIndex
        };
      }
  
      // Handle spectator or game not started state where user is not in players list
       return {
         players: gameState.players,
         hands: gameState.playerHands,
         spreads: gameState.playerSpreads,
         positions,
         adjustedCurrentTurn: gameState.currentTurn,
         currentPlayerIndex: -1 // Indicate user is not a player
       };
  
    }, [gameState.players, gameState.playerHands, gameState.playerSpreads, gameState.currentTurn, user?.username]);
  
    // Extract values from the positioning object
    const {
      players: reorderedPlayers,
      hands: reorderedHands,
      spreads: reorderedSpreads,
      positions,
      adjustedCurrentTurn,
      currentPlayerIndex
    } = getOptimalPlayerPositions;
  
      // ✅ CORRECTED HIT VALIDATION FUNCTION (Excluding 8, 9, 10, Ace high)
      const isValidHit = useCallback((card, spread) => {
          // A hit must be on an existing spread of at least 3 cards
          if (!Array.isArray(spread) || spread.length < 3) {
              console.log('isValidHit: Spread is not array or too short', spread);
              return false;
          }
  
          // The card being hit with must be a valid card object
          if (!card || typeof card.rank !== 'string' || typeof card.suit !== 'string') {
              console.log('isValidHit: Invalid card object', card);
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
                  console.log('isValidHit: Valid hit on same-rank spread');
                  return true;
              } else {
                  console.log('isValidHit: Invalid rank for same-rank hit');
                  return false;
              }
          }
  
          // Check if it's a suited sequence spread
          const isSuitedSequenceSpread = spread.every(c => c.suit === spread[0].suit);
  
          if (isSuitedSequenceSpread) {
              // If it's a suited sequence spread, the hit card must match the suit
              if (card.suit !== spread[0].suit) {
                  console.log('isValidHit: Invalid suit for suited sequence hit');
                  return false;
              }
  
              // Collect all ranks (spread + hit card) and map to values
              const allRanks = [...spread.map(c => c.rank), card.rank];
              const allValues = allRanks.map(rank => values[rank]).sort((a, b) => a - b);
  
              // Check for standard consecutive sequence (e.g., 2, 3, 4, 5)
              let isSequence = true;
              for (let i = 1; i < allValues.length; i++) {
                  if (allValues[i] !== allValues[i - 1] + 1) {
                      isSequence = false;
                      break;
                  }
              }
  
              if (isSequence) {
                   console.log('isValidHit: Valid hit on suited sequence (standard)');
                   return true;
              }
  
               // Check for Ace low sequence (A, 2, 3, 4, 5)
              // When sorted, values would be [1, 2, 3, 4, 5]
               if (allValues.length === 5 && allValues[0] === 1 && allValues[1] === 2 && allValues[2] === 3 && allValues[3] === 4 && allValues[4] === 5) {
                   console.log('isValidHit: Valid hit on suited sequence (Ace low)');
                   return true;
              }
  
              // If it's a suited sequence but doesn't form a valid standard or Ace-low sequence
              console.log('isValidHit: Invalid rank sequence for suited sequence hit', allValues);
              return false;
  
          }
  
          // If it's neither a same-rank nor a suited sequence spread, it's not a valid target
          console.log('isValidHit: Spread is neither same-rank nor suited sequence');
          return false;
  
        }, []); // Dependencies remain the same
  
 
  
    // ✅ SIMPLIFIED HIT HANDLER
    const handleHit = useCallback((targetPlayerIndex, spreadIndex) => {
      // This check ensures the *user interacting* is the current player, in hit mode, etc.    
      if (!hitMode || selectedCard === null || adjustedCurrentTurn !== 0 || isSpectator) {
          console.log('Hit attempt blocked by GameBoard validation:', { hitMode, selectedCard, adjustedCurrentTurn, isSpectator });
          return;
      }
  
      const playerHand = reorderedHands[0] || [];
      const card = playerHand[selectedCard];
  
      if (!card) {
        console.error('Invalid card selection in handleHit');
        return;
      }
  
      // Convert reordered index back to original index
      const originalTargetIndex = (targetPlayerIndex + currentPlayerIndex) % gameState.players.length;
      const targetSpread = gameState.playerSpreads[originalTargetIndex]?.[spreadIndex];
  
      // --- Add logging here ---
      console.log('Attempting hit validation in GameBoard:', {
        cardToHit: card,
        targetSpread: targetSpread,
        targetPlayerOriginalIndex: originalTargetIndex,
        spreadIndex: spreadIndex
      });
      const hitIsValid = isValidHit(card, targetSpread);
      console.log('isValidHit result in GameBoard:', hitIsValid);
      // --- End logging ---
  
  
      if (!targetSpread || !hitIsValid) { // Use the result of the validation
        console.error('Invalid hit target or validation failed');
        return;
      }
  
      console.log('Executing hit:', {
        cardIndex: selectedCard,
        targetIndex: originalTargetIndex,
        spreadIndex
      });
  
      socket.emit('game_action', {
        tableId,
        action: 'HIT',
        payload: {
          cardIndex: selectedCard,
          targetIndex: originalTargetIndex,
          spreadIndex
        }
      });
  
      // Reset hit mode
      setHitMode(false);
      setSelectedCard(null);
    }, [hitMode, selectedCard, adjustedCurrentTurn, reorderedHands, currentPlayerIndex, gameState.playerSpreads, gameState.players.length, isValidHit, socket, tableId, isSpectator]);
  
    const handleSpread = useCallback((cards) => {
      if (isSpectator) return; // ✅ Prevent spectators from spreading
      
      // ✅ Add debounce mechanism to prevent duplicate spread calls
      if (gameState.isProcessingAction) {
        console.log('🔄 Spread action already in progress, skipping');
        return;
      }
      
      if (isValidSpread(cards)) {
        console.log('🎯 Emitting SPREAD action with cards:', cards);
        
        // ✅ Set processing flag to prevent duplicate calls
        setGameState(prev => ({ ...prev, isProcessingAction: true }));
        
        socket.emit('game_action', {
          tableId,
          action: 'SPREAD',
          payload: { cards }
        });
        
        // ✅ Clear processing flag after a short delay
        setTimeout(() => {
          setGameState(prev => ({ ...prev, isProcessingAction: false }));
        }, 1000);
      }
    }, [socket, tableId, isSpectator, gameState.isProcessingAction, setGameState]);
  
    const handleDrop = useCallback(() => {
        const hitPenaltyRounds = gameState.players[currentPlayerIndex]?.hitPenaltyRounds ?? 0;
        const canDrop = !isSpectator && gameState.currentTurn >= 0 && hitPenaltyRounds === 0;
        console.log('[DROP ATTEMPT]', {
            isSpectator,
            currentTurn: gameState.currentTurn,
            currentPlayerIndex,
            hitPenaltyRounds,
            canDrop
        });
        if (isSpectator) return;
        if (canDrop) {
            console.log('[DROP EMIT] Emitting DROP action to backend', {
                tableId,
                action: 'DROP'
            });
            socket.emit('game_action', {
                tableId,
                action: 'DROP'
            });
        } else {
            console.warn('[DROP BLOCKED] Drop action blocked by state', {
                isSpectator,
                currentTurn: gameState.currentTurn,
                currentPlayerIndex,
                hitPenaltyRounds
            });
        }
    }, [gameState.currentTurn, socket, tableId, isSpectator, gameState.players, currentPlayerIndex]);
  
    // ✅ SIMPLIFIED HIT MODE TOGGLE
    const toggleHitMode = useCallback(() => {
      if (isSpectator) return; // ✅ Prevent spectators from toggling hit mode
      setHitMode(prev => !prev);
      setSelectedCard(null);
    }, [isSpectator]);
  
    const handleCardClick = useCallback((cardIndex) => {
        console.log('🎯 handleCardClick called:', {
          cardIndex,
          adjustedCurrentTurn,
          isSpectator,
          hasDrawnCard: gameState.hasDrawnCard,
          hitMode,
          currentPlayer: reorderedPlayers[0]?.username
        });
      
        if (adjustedCurrentTurn !== 0 || isSpectator) {
          console.log('❌ Card click blocked:', { adjustedCurrentTurn, isSpectator });
          return;
        }
      
        if (hitMode) {
          console.log('🎯 Hit mode: selecting card');
          setSelectedCard(cardIndex);
          return;
        }
      
        if (gameState.hasDrawnCard) {
          console.log('🎯 Emitting DISCARD action');
          socket.emit('game_action', {
            tableId,
            action: 'DISCARD',
            payload: { cardIndex }
          });
        } else {
          console.log('❌ Cannot discard: hasDrawnCard is false');
        }
      }, [gameState.hasDrawnCard, adjustedCurrentTurn, socket, tableId, hitMode, isSpectator, reorderedPlayers]);
      
      const handlePlayerAction = useCallback((type) => {
        console.log('🎯 handlePlayerAction called:', {
          type,
          isSpectator,
          hasDrawnCard: gameState.hasDrawnCard,
          deckLength: gameState.deck?.length,
          discardLength: gameState.discardPile?.length
        });
      
        if (isSpectator) {
          console.log('❌ Action blocked: is spectator');
          return;
        }
      
        if (type === 'DRAW_CARD' && !gameState.hasDrawnCard && gameState.deck?.length > 0) {
          console.log('🎯 Emitting DRAW_CARD action');
          socket.emit('game_action', {
            tableId,
            action: 'DRAW_CARD'
          });
        }
      
        if (type === 'DRAW_DISCARD' && !gameState.hasDrawnCard && gameState.discardPile?.length > 0) {
          console.log('🎯 Emitting DRAW_DISCARD action');
          socket.emit('game_action', {
            tableId,
            action: 'DRAW_DISCARD'
          });
        }
      }, [gameState.hasDrawnCard, gameState.deck, gameState.discardPile, socket, tableId, isSpectator]);
      
  
  
  
    const playerScores = useMemo(() => {
      if (!gameState?.playerHands || !gameState?.playerSpreads) return [];
  
      return gameState.playerHands.map((hand, index) => {
        const spreads = gameState.playerSpreads[index] || [];
        const spreadCards = spreads.flat();
  
        return (hand || []).reduce((total, card) => {
          const isInSpread = spreadCards.some(spreadCard =>
            spreadCard.rank === card.rank && spreadCard.suit === card.suit
          );
          return isInSpread ? total : total + (CARD_VALUES[card.rank] || 0);
        }, 0);
      });
    }, [gameState?.playerHands, gameState?.playerSpreads]);
  
    useEffect(() => {
      if (gameState?.deck?.length === 0 && gameState?.gameStarted && !gameState?.gameOver) {
        const finalScores = gameState.playerHands.map(hand =>
          hand.reduce((total, card) => total + CARD_VALUES[card.rank], 0)
        );
        const minScore = Math.min(...finalScores);
        const winners = finalScores
          .map((score, index) => ({ score, index }))
          .filter(({ score }) => score === minScore)
          .map(({ index }) => index);
  
        // socket.emit('game_action', {
        //   tableId,
        //   action: 'STOCK_EMPTY',
        //   payload: { winners, scores: finalScores }
        // });
      }
    }, [gameState?.deck?.length, gameState?.gameStarted, gameState?.gameOver, socket, tableId]);
  
    useEffect(() => {
      const ready =
        Array.isArray(gameState?.playerHands) &&
        gameState.playerHands.every(hand => Array.isArray(hand)) &&
        Array.isArray(gameState?.deck) &&
        gameState.players.length > 0 &&
        gameState.isInitialized;
  
      if (ready) {
        setLoading(false);
      }
    }, [gameState]);
  
    if (loading || !gameState.isInitialized) return <LoadingState />;
    if (!gameState.players || gameState.players.length === 0) return <LoadingState />;
    return (
      <GameErrorBoundary>
        <div className="game-container">
    
          {hitMode && !isSpectator && (
            <div className="hit-mode-message mobile-message">
              <div className="hit-stage-indicator">
                {selectedCard !== null
                  ? "Now click on a spread to hit"
                  : "Select a card from your hand to hit with"}
              </div>
              <button onClick={toggleHitMode} className="cancel-hit-btn">
                Cancel Hit
              </button>
            </div>
          )}
    
          <div className={`game-board players-${reorderedPlayers.length}`}>
    
            {/* 🃏 Center pot, deck, discard */}
            <CenterGameArea
              className="center-area"
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
    
            {/* 🧍 Render all players around the table */}
            {reorderedPlayers.map((player, index) => {
              const position = positions[index]; // top, bottom, left, right
              const isCurrentPlayer = index === 0;
              const isCurrentTurn = adjustedCurrentTurn === index;
              const showActions = position === 'bottom' && isCurrentTurn && !isSpectator;
    
              return (
                <PlayerSection
                  key={`${player?.username || `player-${index}`}-${index}-${gameState?.timestamp || 'initial'}`}
                  position={position}
                  className={`player player-${position} ${isCurrentTurn ? 'active' : ''}`}
                  player={player}
                  hand={reorderedHands[index] || []}
                  spreads={reorderedSpreads[index] || []}
                  isCurrentTurn={isCurrentTurn}
                  hasDrawnCard={gameState.hasDrawnCard}
                  isHidden={position !== 'bottom'} // 👈 SHOW ALL PLAYERS NOW
                  onDrop={handleDrop}
                  hitMode={hitMode}
                  selectedCard={selectedCard}
                  onCardSelect={handleCardClick}
                  onHit={handleHit}
                  onToggleHitMode={toggleHitMode}
                  onSpread={handleSpread}
                  canHit={true}
                  canDrop={!gameState.hasDrawnCard && isCurrentTurn && player.hitPenaltyRounds === 0}
                  isProcessing={false}
                  isLoading={false}
                  gameState={gameState}
                  isActive={hitMode}
                  setGameState={setGameState}
                  onActionComplete={(action) => {
                    if (action === 'DROP') handleDrop();
                  }}
                  onCardClick={handleCardClick}
                  playerIndex={index}
                  isCurrentPlayer={isCurrentPlayer}
                  totalPlayers={reorderedPlayers.length}
                  isSpectator={isSpectator}
                  showActions={showActions}
                />
              );
            })}
          </div>
    
          {/* 🎉 End game screen */}
          {gameState?.gameOver && (
            <GameEndOverlay
              winners={gameState.winners}
              players={gameState.players}
              scores={playerScores}
              winType={gameState.winType}
              stake={Number(gameState.stake)}
              caught={gameState.caught || null}
              onLeaveTable={() => navigate('/lobby')}
              gameEndMessage={gameState.gameEndMessage}
              gameState={gameState}
              setGameState={setGameState}
              tableId={tableId}
              chipBalances={gameState.chipBalances}
              socket={socket}
              isSpectator={isSpectator}
              user={user}
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
    socket: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    isSpectator: PropTypes.bool
  };
  
  GameBoard.defaultProps = {
    isSpectator: false
  };
  
  export default GameBoard;
  
    
