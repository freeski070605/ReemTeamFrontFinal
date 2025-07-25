import React from 'react';
import PropTypes from 'prop-types';
import './PlayerSpreads.css';

const rankToFilenameMap = {
  'ace': 'ace', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'j', 'Q': 'Q', 'K': 'K',
};

const PlayerSpreads = ({
  spreads,
  onSpreadClick,
  selectedCard,
  playerIndex,
  isHitModeActive,
  isSpectator,
  validHitSpreads = []
}) => {

  const handleSpreadClick = (spreadIndex, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isHitModeActive || selectedCard === null || isSpectator) {
      return;
    }

    onSpreadClick(playerIndex, spreadIndex);
  };

  if (!Array.isArray(spreads) || spreads.length === 0) {
    return <div className="spreads-container"></div>;
  }

  return (
      <div className="spreads-container">
          <div className="spreads-list">
              {spreads.map((spread, spreadIndex) => (
                  <div
                      key={`spread-${spreadIndex}`}
                      className={`spread ${isHitModeActive && selectedCard !== null && !isSpectator && validHitSpreads[spreadIndex] ? 'hittable' : ''} ${isHitModeActive && selectedCard !== null && !isSpectator && !validHitSpreads[spreadIndex] ? 'not-hittable' : ''}`}
                      onClick={(event) => handleSpreadClick(spreadIndex, event)}
                  >
                      {spread.map((card, cardIndex) => {
                          const filenameRank = rankToFilenameMap[card.rank] || card.rank;
                          return (
                              <div
                                  key={`${card.rank}-${card.suit}-${cardIndex}`}
                                  className="spread-card"
                              >
                                  <img
                                      src={`${process.env.REACT_APP_PUBLIC_URL}assets/cards/${filenameRank}_of_${card.suit}.png`}
                                      alt={`${card.rank} of ${card.suit}`}
                                      className="spread-card-image"
                                  />
                              </div>
                          );
                      })}
                  </div>
              ))}
          </div>
      </div>
  );
};

PlayerSpreads.propTypes = {
  spreads: PropTypes.array,
  onSpreadClick: PropTypes.func,
  selectedCard: PropTypes.number,
  playerIndex: PropTypes.number,
  isHitModeActive: PropTypes.bool,
  isSpectator: PropTypes.bool,
  validHitSpreads: PropTypes.arrayOf(PropTypes.bool)
};

PlayerSpreads.defaultProps = {
  spreads: [],
  onSpreadClick: () => {},
  selectedCard: null,
  playerIndex: -1,
  isHitModeActive: false,
  isSpectator: false,
  validHitSpreads: []
};

export default PlayerSpreads;
