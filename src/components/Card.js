// Card.js
import React from 'react';
import PropTypes from 'prop-types';
import './Card.css'; // Import the CSS file

const Card = ({ card, onClick, isSelected, isHidden, className }) => {
    const cardImage = isHidden 
        ? `${process.env.PUBLIC_URL}/assets/cards/back.png`
        : `${process.env.PUBLIC_URL}/assets/cards/${card.rank}_of_${card.suit}.png`;

    return (
        <div 
            className={`card ${isSelected ? 'selected' : ''} ${className || ''}`}
            onClick={onClick}
        >
            <img 
                src={cardImage} 
                alt={isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                className="card-image"
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
