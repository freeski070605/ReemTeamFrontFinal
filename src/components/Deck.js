import React from 'react';
import PropTypes from 'prop-types';

const Deck = ({ cards, drawCard, isActive, className }) => {
    console.log('Deck component received cards:', cards?.length);

    const handleClick = () => {
        if (isActive && typeof drawCard === 'function') {
            console.log('Deck clicked:', { cardsRemaining: cards.length, isActive });
            drawCard();
        }
    };

    return (
        <div
            className={`relative flex items-center justify-center cursor-pointer transition-transform duration-200 ease-in
                        ${isActive ? 'hover:scale-105' : 'cursor-default opacity-70'}
                        ${className}`}
            onClick={handleClick}
        >
            {Array.isArray(cards) && cards.length > 0 ? (
                <>
                    <img
                        src={`${process.env.PUBLIC_URL}/assets/cards/back.png`}
                        alt="Deck"
                        className={`w-full h-full object-contain rounded-sm ${className}`}
                    />
                    <div className="absolute bottom-1 right-1 bg-darkBackground/80 text-lightText text-xs font-bold rounded-full px-2 py-0.5">
                        {cards.length}
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-accentGold/70 text-sm text-center">
                    Empty
                </div>
            )}
        </div>
    );
};

Deck.propTypes = {
    cards: PropTypes.array.isRequired,
    drawCard: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
    className: PropTypes.string,
    cardSizeClass: PropTypes.string,
};

Deck.defaultProps = {
    className: '',
    cardSizeClass: 'w-20 aspect-[2.5/3.5]', // Default to a common card size
};

export default Deck;
