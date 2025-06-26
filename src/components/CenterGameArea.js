import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Deck from './Deck';
import DiscardPile from './DiscardPile';
import GameInfo from './GameInfo';
import "./CenterGameArea.css";

const CenterGameArea = ({
    deck = [],
    discardPile = [],
    currentTurn = 0, // Add default value
    hasDrawnCard = false,
    handlePlayerAction,
    isLoading = false,
    players = [],
    pot = 0
}) => {
    const handleDeckDraw = useCallback(() => {
        console.log('Attempting deck draw:', { deckSize: deck.length, hasDrawnCard });
        if (deck.length > 0 && !hasDrawnCard) {
            handlePlayerAction('DRAW_CARD');
        }
    }, [deck.length, hasDrawnCard, handlePlayerAction]);

    const handleDiscardDraw = useCallback(() => {
        console.log('Attempting discard draw:', { pileSize: discardPile.length, hasDrawnCard });
        if (discardPile.length > 0 && !hasDrawnCard) {
            handlePlayerAction('DRAW_DISCARD');
        }
    }, [discardPile.length, hasDrawnCard, handlePlayerAction]);

    // Ensure currentTurn is a valid number
    const validCurrentTurn = typeof currentTurn === 'number' && currentTurn >= 0 ? currentTurn : 0;

    return (
        <div className="center-area">   
                
                <div className="pile-row">
                <Deck 
                    cards={deck || []}
                    drawCard={handleDeckDraw}
                    isActive={validCurrentTurn === 0 && !hasDrawnCard}
                    className="deck"
                />
                
                <GameInfo 
                    pot={pot}
                    currentTurn={validCurrentTurn}
                    players={players}
                    className="game-info pot-display"
                />
                
                <DiscardPile 
                    cards={discardPile || []}
                    onClick={handleDiscardDraw}
                    isActive={!hasDrawnCard && (discardPile?.length > 0)}
                    className="discard-pile"
                />
                </div>
            
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
};

CenterGameArea.propTypes = {
    deck: PropTypes.array,
    discardPile: PropTypes.array,
    currentTurn: PropTypes.number, // Remove .isRequired to allow default
    hasDrawnCard: PropTypes.bool,
    handlePlayerAction: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    players: PropTypes.array,
    pot: PropTypes.number
};

export default React.memo(CenterGameArea);
