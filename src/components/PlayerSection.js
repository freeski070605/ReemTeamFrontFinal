import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import PlayerSpreads from './PlayerSpreads';
import PlayerActions from './PlayerActions';
import { isValidSpread, calculatePoints, findBestSpread, isValidHit } from '../utils/gameUtils';
import './PlayerSection.css';
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
    showActions = false, // NEW: Only show action buttons for bottom player
    validHitSpreads = [] // NEW: Array of booleans indicating valid hit targets for each spread
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
            ${isCurrentTurn ? 'border-accentGold shadow-lg animate-activePulse' : ''}
            ${penalties[position] > 0 ? 'opacity-70' : ''}
            
        >
            {error && <div className="text-error text-sm font-bold mb-sm">{error}</div>}

            {isCurrentTurn && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-accentGold text-darkText text-xs font-bold px-2 py-1 rounded-full z-20 shadow-md">
                    Current Turn
                </div>
            )}
            <div className="flex flex-col items-center w-full">
                <PlayerInfo
                    player={player}
                    isActive={isCurrentTurn}
                    handScore={isCurrentPlayer ? calculatePoints(safeHand) : null}
                    isCurrentPlayer={isCurrentPlayer}
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
                    className="w-full"
                    playerIndex={playerIndex}
                />
            </div>

            <div className="flex flex-col items-center w-full mt-sm p-2 rounded-lg shadow-md bg-gray-800/70 border border-gray-700">
                <MemoizedPlayerSpreads
                    key={`spreads-${position}-${gameState?.updateId || 'initial'}`}
                    spreads={safeSpreads}
                    onSpreadClick={handleHit}
                    isHitModeActive={hitMode}
                    selectedCard={selectedCard}
                    isCurrentPlayer={isCurrentPlayer}
                    isSpectator={isSpectator}
                    position={position}
                    className="w-full"
                    playerIndex={playerIndex}
                    validHitSpreads={validHitSpreads[playerIndex] || []} // Pass validHitSpreads
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
                        className="mt-md flex flex-wrap justify-center gap-sm"
                    />
                )}
            </div>

            {penalties[position] > 0 && (
                <div className="text-error text-sm font-bold mt-sm">
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
    showActions: PropTypes.bool, // Only show action buttons for bottom player
    validHitSpreads: PropTypes.arrayOf(PropTypes.bool) // Add prop type for validHitSpreads
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
    showActions: false,
    validHitSpreads: []
};

export default memo(PlayerSection);
