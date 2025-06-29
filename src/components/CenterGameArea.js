import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Deck from './Deck';
import DiscardPile from './DiscardPile';
import GameInfo from './GameInfo';
const CenterGameArea = ({
    deck = [],
    discardPile = [],
    currentTurn = 0,
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

    const validCurrentTurn = typeof currentTurn === 'number' && currentTurn >= 0 ? currentTurn : 0;

    return (
        <div className="flex flex-col items-center justify-center relative z-5 p-1 transition-all duration-300
                        sm:w-[60vw] sm:h-[60vw] sm:max-w-[400px] sm:max-h-[400px] sm:min-w-[180px] sm:min-h-[180px] sm:border-4 sm:rounded-full sm:bg-tableFelt sm:shadow-lg
                        lg:w-[40vw] lg:h-[40vw] lg:max-w-[600px] lg:max-h-[600px] lg:min-w-[320px] lg:min-h-[320px] lg:border-6 lg:rounded-full lg:bg-tableFelt lg:shadow-xl">

            <div className="flex flex-row justify-center items-end gap-1 mt-0 w-full max-w-full flex-wrap
                            sm:gap-2
                            lg:gap-3">
                <Deck
                    cards={deck || []}
                    drawCard={handleDeckDraw}
                    isActive={validCurrentTurn === 0 && !hasDrawnCard}
                    className="w-20 aspect-[2.5/3.5] rounded-sm bg-cardBackground shadow-sm border-1.5 border-primary transition-all duration-200
                                sm:w-24 sm:rounded-sm
                                lg:w-28 lg:rounded-sm"
                    cardSizeClass="w-20 max-w-[100px] min-w-16"
                />

                <GameInfo
                    pot={pot}
                    currentTurn={validCurrentTurn}
                    players={players}
                    className="p-1 px-2 bg-darkBackground/90 rounded-md text-accentGold font-bold text-xs text-center shadow-sm border-1.5 border-accentGold
                                sm:text-sm sm:rounded-lg sm:p-1.5 sm:px-2
                                lg:text-base lg:rounded-xl lg:p-2 lg:px-3"
                />

                <DiscardPile
                    cards={discardPile || []}
                    onClick={handleDiscardDraw}
                    isActive={!hasDrawnCard && (discardPile?.length > 0)}
                    className="w-20 aspect-[2.5/3.5] rounded-sm bg-cardBackground shadow-sm border-1.5 border-primary transition-all duration-200
                                sm:w-24 sm:rounded-sm
                                lg:w-28 lg:rounded-sm"
                    cardSizeClass="w-20 max-w-[100px] min-w-16"
                />
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-darkBackground/70 z-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
