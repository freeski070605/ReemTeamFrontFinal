import React from 'react';

const GameInfo = ({ pot, currentTurn, players, gameStatus }) => {
    return (
        <div className="game-info">
            <div className="pot-info">
                <h3>Pot: ${pot}</h3>
            </div>
            <div className="turn-info">
                <h4>Current Turn: {players[currentTurn]?.username}</h4>
            </div>
            {gameStatus && (
                <div className="game-status">
                    <p>{gameStatus}</p>
                </div>
            )}
        </div>
    );
};

export default GameInfo;
