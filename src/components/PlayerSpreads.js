import React from 'react';
import { PLAYER_POSITIONS } from './gameConstants';
import PropTypes from 'prop-types'; // Import PropTypes

const PlayerSpreads = ({
  spreads,
  onSpreadClick,
  // isActive, // Remove this prop
  selectedCard,
  position,
  className,
  playerIndex, // Use playerIndex instead of converting position
  isHitModeActive, // New prop: indicates if the current user is in hit mode
  isCurrentPlayer, // New prop: indicates if this PlayerSection belongs to the current user
  isSpectator // New prop: indicates if the current user is a spectator
}) => {

  const handleSpreadClick = (spreadIndex, event) => {
    event.preventDefault();
    event.stopPropagation();

    // Updated clickability check:
    // Spreads are clickable for hitting if the current user is the current player,
    // is in hit mode, has a card selected, and is not a spectator.
    if (!isHitModeActive || selectedCard === null || isSpectator) {
      console.log('Spread not clickable for hit:', { isCurrentPlayer, isHitModeActive, selectedCard, isSpectator });
      return;
    }

    console.log('Spread clicked:', {
      playerIndex, // This is the index of the player whose spreads were clicked
      spreadIndex,
      selectedCard,
      isCurrentPlayer,
      isHitModeActive,
      isSpectator
    });

    // Call the hit handler with the index of the player whose spreads were clicked
    // and the index of the spread within that player's spreads.
    onSpreadClick(playerIndex, spreadIndex);
  };

  if (!Array.isArray(spreads) || spreads.length === 0) {
    return <div className={`spreads-container ${className}`}></div>;
  }

  // Determine if spreads are visually clickable based on the new logic
  // We keep this logic but won't use it for adding a class or inline style for now
  // const areSpreadsClickable = isCurrentPlayer && isHitModeActive && selectedCard !== null && !isSpectator;

  return (
      <div className={`w-full p-2 overflow-x-visible rounded-lg shadow-none ${className}`}>
          <div className="flex flex-row gap-2 p-1 w-full max-w-full overflow-x-auto">
              {spreads.map((spread, spreadIndex) => (
                  <div
                      key={`spread-${spreadIndex}`}
                      className={`flex gap-1 bg-accentGold/10 p-2 rounded-lg min-w-fit cursor-pointer transition-all duration-200 ease-in-out shadow-sm border-2 border-transparent
                                  hover:translate-y-[-4px] hover:scale-105 hover:bg-accentGold/20 hover:shadow-lg hover:border-accentGold
                                  ${isHitModeActive && selectedCard !== null && !isSpectator ? 'border-primary' : ''}`}
                      onClick={(event) => handleSpreadClick(spreadIndex, event)}
                  >
                      {spread.map((card, cardIndex) => (
                          <div
                              key={`${card.rank}-${card.suit}-${cardIndex}`}
                              className="w-16 max-w-[90px] min-w-12 relative rounded-md shadow-sm"
                          >
                              <img
                                  src={`${process.env.PUBLIC_URL}/assets/cards/${card.rank}_of_${card.suit}.png`}
                                  alt={`${card.rank} of ${card.suit}`}
                                  className="w-full h-auto rounded-md shadow-sm bg-cardBackground transition-all duration-200 ease-in-out"
                              />
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      </div>
  );
};

// Update PropTypes
PlayerSpreads.propTypes = {
  spreads: PropTypes.array,
  onSpreadClick: PropTypes.func,
  // isActive: PropTypes.bool, // Remove this prop type
  selectedCard: PropTypes.number,
  position: PropTypes.string,
  className: PropTypes.string,
  playerIndex: PropTypes.number, // Add prop type for playerIndex
  isHitModeActive: PropTypes.bool, // Add new prop type
  isCurrentPlayer: PropTypes.bool, // Add new prop type
  isSpectator: PropTypes.bool // Add new prop type
};

// Provide default props
PlayerSpreads.defaultProps = {
  spreads: [],
  onSpreadClick: () => {},
  // isActive: false, // Remove this default prop
  selectedCard: null,
  position: '',
  className: '',
  playerIndex: -1,
  isHitModeActive: false,
  isCurrentPlayer: false,
  isSpectator: false
};

export default PlayerSpreads;
