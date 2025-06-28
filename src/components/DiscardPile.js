import PropTypes from 'prop-types';
import React from 'react';

const DiscardPile = ({ cards, onClick, isActive, className }) => {
    const validCards = Array.isArray(cards) ? cards : [];
    const topCard = validCards.length > 0 ? validCards[validCards.length - 1] : null;
    
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
                        src={`${process.env.PUBLIC_URL}/assets/cards/${topCard.rank}_of_${topCard.suit}.png`}
                        alt={`${topCard.rank} of ${topCard.suit}`}
                        className={`w-full h-full object-contain rounded-md shadow-md ${cardSizeClass}`}
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
    cardSizeClass: 'w-16 aspect-[2.5/3.5]', // Default to a common card size
};

export default DiscardPile;
