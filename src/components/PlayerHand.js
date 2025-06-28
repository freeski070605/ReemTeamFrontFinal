import React from 'react';
const PlayerHand = ({ cards, isActive, onCardClick, onCardSelect, hitMode, selectedCard, isHidden }) => {
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
        <div className="flex justify-center items-center w-full max-w-full p-0 overflow-visible relative z-2 min-h-[200px] rounded-lg pb-8"> {/* Increased min-h and added pb-4 */}
            <div className="flex flex-row flex-nowrap items-center gap-2 w-full min-w-0 max-w-full h-auto m-0 p-0 justify-center overflow-x-auto overscroll-x-contain scrollbar-hide
                            sm:flex-wrap sm:overflow-x-hidden sm:h-auto sm:gap-3
                            lg:flex-nowrap lg:overflow-x-visible lg:h-auto lg:gap-2 w-full max-w-full">
                {sortedCards.map((card, i) => {
                    const total = sortedCards.length;
                    const spread = Math.min(90, total * 12);
                    const start = -spread / 2;
                    const angle = start + (i * (spread / (total - 1 || 1)));
                    const curve = Math.abs(angle) * 0.3; // Reduced curve effect
                    const filenameRank = rankToFilenameMap[card.rank] || card.rank;

                    const cardClasses = `
                        flex-shrink-0 cursor-pointer transition-all duration-200 ease-in-out transform-gpu
                        w-16 max-w-[90px] min-w-12 rounded-md bg-cardBackground shadow-sm border-2 border-transparent relative z-10
                        hover:scale-110 hover:-translate-y-2 hover:shadow-lg hover:border-accentGold hover:z-30
                        ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}
                        ${selectedCard === card.originalIndex ? 'scale-110 -translate-y-4 shadow-xl border-accentGold z-40' : ''}
                    `;

                    return (
                        <div
                            key={`${card.rank}-${card.suit}-${card.originalIndex}`}
                            className={cardClasses}
                            style={{
                                transform: `rotate(${angle}deg) translateY(${curve}px)`,
                            }}
                            onClick={() => handleCardInteraction(card.originalIndex)}
                        >
                            <img
                                src={
                                    isHidden
                                        ? `${process.env.REACT_APP_PUBLIC_URL}assets/cards/back.png`
                                        : `${process.env.REACT_APP_PUBLIC_URL}assets/cards/${filenameRank}_of_${card.suit}.png`
                                }
                                alt={isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                                className="w-full h-auto select-none pointer-events-none rounded-[8px] shadow-sm bg-cardBackground"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayerHand;
