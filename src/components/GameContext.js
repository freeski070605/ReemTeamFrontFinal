// GameContext.js
import React, { createContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  playerHands: [],
  playerSpreads: [],
  deck: [],
  discardPile: [],
  currentTurn: 0,
  hasDrawnCard: false,
  gameOver: false,
  pot: 0,
  players: [],
  stake: 0,
  gameEndMessage: '',
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, ...action.payload };
    // Add more cases as needed
    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;