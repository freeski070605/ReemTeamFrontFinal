import React from 'react';

const GameInfo = ({ pot, currentTurn, players, gameStatus }) => {
    return (
        <div className="p-1 px-2 bg-darkBackground/90 rounded-md text-accentGold font-bold text-xs text-center shadow-sm border-1.5 border-accentGold
                    sm:text-sm sm:rounded-lg sm:p-1.5 sm:px-2
                    lg:text-base lg:rounded-xl lg:p-2 lg:px-3">
            <div className="text-lg">
                <h3>Pot: ${pot}</h3>
            </div>
            <div className="text-md">
                <h4>Current Turn: {players[currentTurn]?.username}</h4>
            </div>
            {gameStatus && (
                <div className="text-sm text-lightText">
                    <p>{gameStatus}</p>
                </div>
            )}
        </div>
    );
};

export default GameInfo;
