import React from 'react';
import './PlayerHand.css';

const PlayerHand = ({ cards, isActive, onCardClick, onCardSelect, hitMode, selectedCard, isHidden }) => {
    if (!Array.isArray(cards)) return null;

    const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
    const rankOrder = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // Map card ranks to their actual filename prefixes to handle case sensitivity
    const rankToFilenameMap = {
        'ace': 'ace',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '6': '6',
        '7': '7',
        '8': '8',
        '9': '9',
        '10': '10',
        'J': 'j', // Map 'J' to 'j' for filename consistency
        'Q': 'Q',
        'K': 'K',
    };

    // Attach originalIndex and sort cards
    const sortedCards = cards
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort((a, b) => {
            const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            if (suitDiff !== 0) return suitDiff;
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        });

    const handleCardInteraction = (originalIndex) => {
        if (!isActive || isHidden) return;

        console.log('Card interaction:', {
            card: cards[originalIndex],
            originalIndex,
            mode: hitMode ? 'hit' : 'discard'
        });

        if (hitMode) {
            onCardSelect(originalIndex);
        } else {
            onCardClick(originalIndex);
        }
    };

    return (
        <div className={`player-hand-container ${isActive ? 'active' : ''}`}>
            <div className="cards-scroll-container">
                <div className="cards-wrapper">
                {sortedCards.map((card, i) => {
                    // Fanned hand effect: center card is 0deg, others spread left/right
                    const total = sortedCards.length;
                    const spread = Math.min(90, total * 12); // max 90deg spread, 12deg per card
                    const start = -spread / 2;
                    const angle = start + (i * (spread / (total - 1 || 1)));
                    // Curve: cards further from center are slightly lower
                    const curve = Math.abs(angle) * 0.7; // px down for curve
                    const filenameRank = rankToFilenameMap[card.rank] || card.rank; // Use mapped rank or original
                    return (
                      <div
                        key={`${card.rank}-${card.suit}-${card.originalIndex}`}
                        className={`
                            card
                            ${isActive ? 'clickable' : ''}
                            ${selectedCard === card.originalIndex ? 'selected' : ''}
                            ${hitMode ? 'hit-mode' : 'discard-mode'}
                        `}
                        style={{
                          transform: `rotate(${angle}deg) translateY(${curve}px)`
                        }}
                        onClick={() => handleCardInteraction(card.originalIndex)}
                      >
                        <img
                          src={
                            isHidden
                              ? `${process.env.PUBLIC_URL}/assets/cards/back.png`
                              : `${process.env.PUBLIC_URL}/assets/cards/${filenameRank}_of_${card.suit}.png`
                          }
                          alt={isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                          className="card-image"
                        />
                      </div>
                    );
                })}
            </div>
        </div>
        </div>
    );
};

export default PlayerHand;
