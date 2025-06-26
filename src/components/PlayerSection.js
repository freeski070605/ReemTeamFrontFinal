import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import PlayerSpreads from './PlayerSpreads';
import PlayerActions from './PlayerActions';
import { isValidSpread, calculatePoints, findBestSpread, isValidHit } from '../utils/gameUtils';
import './PlayerSection.css';

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
    isProcessing,
    isLoading,
    gameState,
    isActive,
    setGameState,
    onActionComplete,
    onCardClick,
    playerIndex, // ✅ NEW: Accept playerIndex prop
    isCurrentPlayer, // NEW: Indicates if this is the current user
    totalPlayers, // NEW: Total number of players in game
    isSpectator, // ✅ NEW: Accept isSpectator prop
    showActions = false // NEW: Only show action buttons for bottom player
  }) => {
    const [selectedCards, setSelectedCards] = useState([]);
    const [selectedSpread, setSelectedSpread] = useState(null);
    const [error, setError] = useState(null);

     

    // Ensure gameState penalties exists
    const penalties = useMemo(() => {
        return gameState?.penalties || {};
    }, [gameState]);

    // Safeguard against missing hand data
    const safeHand = useMemo(() => {
        if (!hand || !Array.isArray(hand)) {
            console.warn('Invalid hand data in PlayerSection:', hand);
            return [];
        }
        return hand;
    }, [hand]);

    // Safeguard against missing spreads data
    const safeSpreads = useMemo(() => {
        if (!spreads || !Array.isArray(spreads)) {
            console.warn('Invalid spreads data in PlayerSection:', spreads);
            return [];
        }
        return spreads;
    }, [spreads]);

    const canDropBasedOnPoints = useMemo(() => {
        // ✅ Add isSpectator check
        return !isSpectator && calculatePoints(safeHand) <= 30 && !hasDrawnCard && isCurrentTurn;
    }, [safeHand, hasDrawnCard, isCurrentTurn, isSpectator]); // ✅ Add isSpectator dependency

    const handleSpread = (cards) => {
        // ✅ Prevent spectators from spreading
        if (isSpectator) return;
        try {
            if (isValidSpread(cards)) {
                onSpread(cards);
            }
        } catch (err) {
            console.error('Error handling spread:', err);
            setError('Failed to create spread');
        }
    };

    const handleHit = (cardIndex, targetIndex, spreadIndex) => {
        // ✅ Prevent spectators from spreading
        if (isSpectator) return;
        try {
            if (isCurrentTurn && hasDrawnCard) {
                onHit(cardIndex, targetIndex, spreadIndex);
            }
        } catch (err) {
            console.error('Error handling hit:', err);
            setError('Failed to hit target');
        }
    };

    const handleDropAction = () => {
        // ✅ Prevent spectators from spreading
        if (isSpectator) return;
        try {
            if (canDropBasedOnPoints) {
                onDrop();
                onActionComplete?.('DROP');
            }
        } catch (err) {
            console.error('Error handling drop:', err);
            setError('Failed to drop');
        }
    };

    const handleCardClick = (cardIndex) => {
        // ✅ Prevent spectators from spreading
        if (isSpectator) return;
        try {
            if (isCurrentTurn && hasDrawnCard) {
                onCardClick(cardIndex);
            }
        } catch (err) {
            console.error('Error handling card click:', err);
        }
    };

    

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    

    

    return (
        <div
          className={`player-section ${position} ${isCurrentTurn ? 'active' : ''} ${className || ''} ${
            penalties[position] > 0 ? 'penalized' : ''
          }`}
        >
          {error && <div className="error-message">{error}</div>}
      
          <div className="player-main">
            <MemoizedPlayerInfo
              player={player}
              isActive={isCurrentTurn}
              className="player-info"
            />
      
            <MemoizedPlayerHand
              key={`hand-${safeHand.length}-${isCurrentTurn}-${gameState?.updateId || 'initial'}`}
              cards={safeHand}
              isActive={isCurrentTurn && !isSpectator}
              onCardClick={handleCardClick}
              isHidden={isHidden}
              hitMode={hitMode}
              onToggleHitMode={onToggleHitMode}
              selectedCard={selectedCard}
              onCardSelect={onCardSelect}
              className={`player-hand ${position}`}
              playerIndex={playerIndex}
            />
          </div>
      
          <div className="player-side">
            <MemoizedPlayerSpreads
              key={`spreads-${position}-${gameState?.updateId || 'initial'}`}
              spreads={safeSpreads}
              onSpreadClick={handleHit}
              isHitModeActive={hitMode}
              selectedCard={selectedCard}
              isCurrentPlayer={isCurrentPlayer}
              isSpectator={isSpectator}
              position={position}
              className={`player-spreads ${position}`}
              playerIndex={playerIndex}
            />
      
            {showActions && isCurrentTurn && !isHidden && !isSpectator && (
              <MemoizedPlayerActions
                isActive={isCurrentTurn}
                canSpread={isValidSpread}
                canHit={canHit}
                hasDrawnCard={hasDrawnCard}
                onSpread={handleSpread}
                onHit={handleHit}
                onToggleHitMode={onToggleHitMode}
                isHitModeActive={hitMode}
                onDrop={handleDropAction}
                canDrop={canDropBasedOnPoints}
                gameState={gameState || {}}
                setGameState={setGameState}
                onActionComplete={onActionComplete}
                className="player-actions"
              />
            )}
          </div>
      
          {penalties[position] > 0 && (
            <div className="penalty-indicator">
              Penalized: {penalties[position]} turns
            </div>
          )}
        </div>
      );
    };
      

// Update PropTypes
PlayerSection.propTypes = {
    position: PropTypes.string.isRequired,
    player: PropTypes.object,
    hand: PropTypes.array,
    canSpread: PropTypes.bool,
    spreads: PropTypes.array,
    isCurrentTurn: PropTypes.bool,
    isHidden: PropTypes.bool,
    hasDrawnCard: PropTypes.bool,
    onDrop: PropTypes.func,
    hitMode: PropTypes.bool,
    selectedCard: PropTypes.number,
    onCardSelect: PropTypes.func,
    onHit: PropTypes.func,
    onToggleHitMode: PropTypes.func,
    onSpread: PropTypes.func,
    canHit: PropTypes.bool,
    canDrop: PropTypes.bool,
    isProcessing: PropTypes.bool,
    isActive: PropTypes.bool,
    onCardClick: PropTypes.func,
    gameState: PropTypes.object,
    setGameState: PropTypes.func,
    onActionComplete: PropTypes.func,
    className: PropTypes.string,
    playerIndex: PropTypes.number, // Add prop type for playerIndex
    isCurrentPlayer: PropTypes.bool, // Add prop type for isCurrentPlayer
    totalPlayers: PropTypes.number, // Add prop type for totalPlayers
    isSpectator: PropTypes.bool,
    showActions: PropTypes.bool // Only show action buttons for bottom player
};

// Provide default props
PlayerSection.defaultProps = {
    hand: [],
    spreads: [],
    isCurrentTurn: false,
    isHidden: false,
    hasDrawnCard: false,
    hitMode: false,
    canHit: false,
    canDrop: false,
    isProcessing: false,
    isActive: false,
    gameState: { penalties: {} },
    playerIndex: -1, // Default value
    isCurrentPlayer: false, // Default value
    totalPlayers: 0, // Default value
    isSpectator: false,
    showActions: false
};

export default memo(PlayerSection);