import React from 'react';
import PropTypes from 'prop-types';
import './Deck.css';
const Deck = ({ cards, drawCard, isActive }) => {
    console.log('Deck component received cards:', cards?.length);

    const handleClick = () => {
        if (isActive && typeof drawCard === 'function') {
            console.log('Deck clicked:', { cardsRemaining: cards.length, isActive });
            drawCard();
        }
    };

    return (
        <div 
            className={`deck ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            style={{ cursor: isActive ? 'pointer' : 'default' }}
        >
            {Array.isArray(cards) && cards.length > 0 ? (
                <>
                    <img 
                        src={`${process.env.PUBLIC_URL}/assets/cards/back.png`}
                        alt="Deck"
                        className="deck-cardback"
                    />
                    <div className="card-count">{cards.length}</div>
                </>
            ) : (
                <div className="empty-deck">Empty</div>
            )}
        </div>
    );
};

Deck.propTypes = {
    cards: PropTypes.array.isRequired,
    drawCard: PropTypes.func.isRequired,
    isActive: PropTypes.bool
};

export default Deck;
