import React from 'react';

import { DollarSign, Crown } from 'lucide-react';

const GameInfo = ({ pot, currentTurn, players, gameStatus }) => {
    return (
        <div className="p-1 px-2 bg-darkBackground/90 rounded-md text-accentGold font-bold text-xs text-center shadow-sm border-1.5 border-accentGold
                    sm:text-sm sm:rounded-lg sm:p-1.5 sm:px-2
                    lg:text-base lg:rounded-xl lg:p-2 lg:px-3 flex flex-col items-center justify-center">
            <div className="text-lg flex items-center gap-1">
                <DollarSign size={20} className="text-success" />
                <h3>Pot: ${pot}</h3>
            </div>
            <div className="text-md flex items-center gap-1 mt-1">
                <Crown size={16} className="text-accentGold" />
                <h4>Turn: {players[currentTurn]?.username}</h4>
            </div>
            {gameStatus && (
                <div className="text-sm text-lightText mt-1">
                    <p>{gameStatus}</p>
                </div>
            )}
        </div>
    );
};

export default GameInfo;
