import PropTypes from 'prop-types';
import React from 'react';

const DiscardPile = ({ cards, onClick, isActive }) => {
    const validCards = Array.isArray(cards) ? cards : [];
    const topCard = validCards.length > 0 ? validCards[validCards.length - 1] : null;
    
    return (
        <div 
            className={`discard-pile ${isActive ? 'active' : ''}`}
            onClick={() => isActive && onClick && onClick()}
            style={{
                background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.8), rgba(45, 45, 45, 0.8))',
                borderRadius: '10px',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {!topCard ? (
                <div className="empty-pile">
                    <div className="empty-pile-text">Discard Pile</div>
                </div>
            ) : (
                <div className="pile-container">
                    <div className="card-count">{validCards.length}</div>
                    <div className="top-card">
                        <img 
                            src={`${process.env.PUBLIC_URL}/assets/cards/${topCard.rank}_of_${topCard.suit}.png`}
                            alt={`${topCard.rank} of ${topCard.suit}`}
                            className="card-image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '10px',
                                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

DiscardPile.propTypes = {
    cards: PropTypes.array.isRequired,
    onClick: PropTypes.func,
    isActive: PropTypes.bool
};

export default DiscardPile;
