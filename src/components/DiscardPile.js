import PropTypes from 'prop-types';
import React from 'react';

const rankToFilenameMap = {
    'ace': 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
    'J': 'j', 'Q': 'Q', 'K': 'K',
};

const DiscardPile = ({ cards, onClick, isActive, className, cardSizeClass }) => {
    const validCards = Array.isArray(cards) ? cards : [];
    const topCard = validCards.length > 0 ? validCards[validCards.length - 1] : null;
    
    const filenameRank = topCard ? (rankToFilenameMap[topCard.rank] || topCard.rank) : '';

    return (
        <div
            className={`relative flex items-center justify-center transition-transform duration-200 ease-in
                        ${isActive ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-70'}
                        ${className}`}
            onClick={() => isActive && onClick && onClick()}
        >
            {!topCard ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-lightText/70 text-sm text-center">
                    <span className="text-xs">Discard</span>
                    <span className="text-lg font-bold">Pile</span>
                </div>
            ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute bottom-1 right-1 bg-darkBackground/80 text-lightText text-xs font-bold rounded-full px-2 py-0.5">
                        {validCards.length}
                    </div>
                    <img
                        src={`${process.env.REACT_APP_PUBLIC_URL}assets/cards/${filenameRank}_of_${topCard.suit}.png`}
                        alt={topCard ? `${topCard.rank} of ${topCard.suit}` : 'Discard Pile Card'}
                        className={`w-full h-full object-contain rounded-sm shadow-md ${cardSizeClass}`}
                    />
                </div>
            )}
        </div>
    );
};

DiscardPile.propTypes = {
    cards: PropTypes.array.isRequired,
    onClick: PropTypes.func,
    isActive: PropTypes.bool,
    className: PropTypes.string,
    cardSizeClass: PropTypes.string,
};

DiscardPile.defaultProps = {
    className: '',
    cardSizeClass: 'w-20 aspect-[2.5/3.5]', // Default to a common card size
};

export default DiscardPile;
