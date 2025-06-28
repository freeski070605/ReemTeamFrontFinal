// Card.js
import React from 'react';
import PropTypes from 'prop-types';
const Card = ({ card, onClick, isSelected, isHidden, className }) => {
    const cardImage = isHidden
        ? `${process.env.REACT_APP_PUBLIC_URL}assets/cards/back.png`
        : `${process.env.REACT_APP_PUBLIC_URL}assets/cards/${card.rank}_of_${card.suit}.png`;

    return (
        <div
            className={`
                w-full h-auto aspect-[2.5/3.5] rounded-md object-contain shadow-md transition-transform duration-200 ease-in-out
                ${isSelected ? 'transform -translate-y-3 shadow-lg z-50' : ''}
                ${className || ''}
            `}
            onClick={onClick}
        >
            <img
                src={cardImage}
                alt={isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                className="w-full h-auto select-none pointer-events-none rounded-md"
            />
        </div>
    );
};


Card.propTypes = {
    card: PropTypes.shape({
        rank: PropTypes.string.isRequired,
        suit: PropTypes.string.isRequired
    }).isRequired
};

export default Card;
