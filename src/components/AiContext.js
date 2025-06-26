import React, { createContext, useMemo } from 'react';
import AiPlayer from './AiPlayerHand';

export const AIContext = createContext();

export const AIPlayerProvider = ({ children }) => {
  const aiPlayer = useMemo(() => new AiPlayer('AI Player'), []);
  
  return (
    <AIContext.Provider value={aiPlayer}>
      {children}
    </AIContext.Provider>
  );
};
