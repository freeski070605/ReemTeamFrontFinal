import React from 'react';
import PlayerActions from './PlayerActions';
import './PlayerHand.css';

const PlayerHand = ({ cards, isActive, onCardClick, onCardSelect, hitMode, selectedCard, isHidden, showActions, onDrop, onToggleHitMode, onSpread, canHit, canDrop, hasDrawnCard, gameState, setGameState, onActionComplete }) => {
    if (!Array.isArray(cards)) return null;

    const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
    const rankOrder = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const rankToFilenameMap = {
        'ace': 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        'J': 'j', 'Q': 'Q', 'K': 'K',
    };

    const sortedCards = cards
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort((a, b) => {
            const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
            if (rankDiff !== 0) return rankDiff;
            return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
        });

    const handleCardInteraction = (originalIndex) => {
        if (!isActive || isHidden) return;

        if (hitMode) {
            onCardSelect(originalIndex);
        } else {
            onCardClick(originalIndex);
        }
    };

    return (
        <div className="player-hand-container">
            {showActions && (
                <div className="player-actions-bar">
                    <PlayerActions
                        isActive={isActive}
                        canSpread={() => {}}
                        canHit={canHit}
                        hasDrawnCard={hasDrawnCard}
                        onSpread={onSpread}
                        onHit={() => onToggleHitMode()}
                        onToggleHitMode={onToggleHitMode}
                        isHitModeActive={hitMode}
                        onDrop={onDrop}
                        canDrop={canDrop}
                        gameState={gameState}
                        setGameState={setGameState}
                        onActionComplete={onActionComplete}
                    />
                    <div className="turn-indicator">YOUR TURN</div>
                </div>
            )}
            <div className="player-hand">
                {sortedCards.map((card) => (
                    <div
                        key={`${card.rank}-${card.suit}-${card.originalIndex}`}
                        className={`card ${selectedCard === card.originalIndex ? 'selected' : ''}`}
                        onClick={() => handleCardInteraction(card.originalIndex)}
                    >
                        <img
                            src={
                                isHidden
                                    ? `${process.env.REACT_APP_PUBLIC_URL}assets/cards/back.png`
                                    : `${process.env.REACT_APP_PUBLIC_URL}assets/cards/${rankToFilenameMap[card.rank]}_of_${card.suit}.png`
                            }
                            alt={isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                            className="card-image"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerHand;
