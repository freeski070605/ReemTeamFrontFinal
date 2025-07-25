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
    if (deck.length > 0 && !hasDrawnCard) {
      handlePlayerAction('DRAW_CARD');
    }
  }, [deck.length, hasDrawnCard, handlePlayerAction]);

  const handleDiscardDraw = useCallback(() => {
    if (discardPile.length > 0 && !hasDrawnCard) {
      handlePlayerAction('DRAW_DISCARD');
    }
  }, [discardPile.length, hasDrawnCard, handlePlayerAction]);

  const validCurrentTurn = typeof currentTurn === 'number' && currentTurn >= 0 ? currentTurn : 0;

  return (
    <div className="center-game-area-mobile-landscape relative flex flex-col items-center justify-center p-3 transition-all duration-300
                    border-4 border-yellow-400 rounded-full bg-green-800 shadow-xl w-44 h-44 sm:w-48 sm:h-48 lg:w-60 lg:h-60">
      {/* Deck, Pot Info, Discard arranged horizontally */}
      <div className="flex flex-row justify-between items-center gap-3 w-full">
        {/* Deck */}
        <Deck
          cards={deck || []}
          drawCard={handleDeckDraw}
          isActive={validCurrentTurn === 0 && !hasDrawnCard}
          className="w-16 aspect-[2.5/3.5] rounded-sm shadow-md border-2 border-green-400 hover:scale-105 transition-transform duration-200"
          cardSizeClass="w-16 max-w-[90px] min-w-[50px]"
        />

        {/* Pot & Turn Info */}
        <GameInfo
          pot={pot}
          currentTurn={validCurrentTurn}
          players={players}
          className="flex flex-col items-center justify-center text-center px-2 py-1 bg-black/60 rounded-md text-yellow-300 font-bold text-xs shadow-md"
        />

        {/* Discard Pile */}
        <DiscardPile
          cards={discardPile || []}
          onClick={handleDiscardDraw}
          isActive={!hasDrawnCard && (discardPile?.length > 0)}
          className="w-16 aspect-[2.5/3.5] rounded-sm shadow-md border-2 border-green-400 hover:scale-105 transition-transform duration-200"
          cardSizeClass="w-16 max-w-[90px] min-w-[50px]"
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300"></div>
        </div>
      )}
    </div>
  );
};

CenterGameArea.propTypes = {
  deck: PropTypes.array,
  discardPile: PropTypes.array,
  currentTurn: PropTypes.number,
  hasDrawnCard: PropTypes.bool,
  handlePlayerAction: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  players: PropTypes.array,
  pot: PropTypes.number
};

export default React.memo(CenterGameArea);
