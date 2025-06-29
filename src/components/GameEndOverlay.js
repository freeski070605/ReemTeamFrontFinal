import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { shuffleDeck, dealHands, INITIAL_DECK } from '../utils/gameUtils';
import { CARD_VALUES } from './gameConstants';
import AuthService from "./AuthService";

const ScoreDisplay = ({ player, index, score, isWinner }) => (
    <div className={`flex justify-between items-center p-2 my-1 rounded-lg ${isWinner ? 'bg-yellow-700 bg-opacity-30 border border-yellow-500' : 'bg-gray-700'}`}>
        <span className="text-lg font-semibold text-white">
            {player.username} {isWinner && '🏆'}
        </span>
        <span className="text-lg font-medium text-gray-200">Points: {score}</span>
        {isWinner && <span className="ml-2 px-2 py-1 bg-yellow-500 text-gray-900 font-bold rounded-full text-xs animate-pulse">Winner!</span>}
    </div>
);

const GameEndOverlay = ({
    winners = [],
    players = [],
    playerHands = [],
    winType,
    caught,
    stake,
    gameState,
    setGameState,
    tableId,
    onGameRestart,
    socket,
    isSpectator,
    user,
    finalScores, // New prop for final scores
    reason // New prop for game end reason
}) => {
    const [countdown, setCountdown] = useState(15);
    const [hasPlayerReadied, setHasPlayerReadied] = useState(false);
    const navigate = useNavigate();

    // Reset overlay state when game starts (gameOver becomes false)
    useEffect(() => {
        console.log('GameEndOverlay: gameOver state changed:', {
            gameOver: gameState.gameOver,
            gameStarted: gameState.gameStarted,
            timestamp: gameState.timestamp
        });
        
        if (!gameState.gameOver) {
            // Game has started, reset overlay state
            console.log('GameEndOverlay: Resetting overlay state - game started');
            setCountdown(15);
            setHasPlayerReadied(false);
        }
    }, [gameState.gameOver]);

    // Countdown timer effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && !hasPlayerReadied) {
            // Auto-start when countdown reaches 0
            handlePlayAgain();
        }
    }, [countdown, hasPlayerReadied]);

    // Debug logging for overlay rendering
    console.log('GameEndOverlay: Rendering with state:', {
        gameOver: gameState.gameOver,
        gameStarted: gameState.gameStarted,
        countdown,
        hasPlayerReadied,
        timestamp: gameState.timestamp
    });

// ✅ Better logic to determine if current user is actually a player with detailed logging
// ✅ Better logic with more detailed debugging
const isCurrentUserPlayer = useCallback(() => {
    console.log('GameEndOverlay: isCurrentUserPlayer check - Raw data:', {
        user,
        players,
        gameStateTimestamp: gameState?.timestamp
    });

    if (!user || !players || !Array.isArray(players)) {
        console.log('GameEndOverlay: Missing user or players data', { 
            hasUser: !!user, 
            userUsername: user?.username,
            hasPlayers: !!players, 
            playersIsArray: Array.isArray(players),
            playersLength: players?.length 
        });
        return false;
    }
    
    // ✅ Show exact comparison details
    console.log('GameEndOverlay: Detailed username comparison:', {
        userUsername: user?.username,
        userUsernameType: typeof user?.username,
        playersData: players.map((p, index) => ({
            index,
            username: p?.username,
            usernameType: typeof p?.username,
            exactMatch: p?.username === user?.username,
            isHuman: p?.isHuman,
            // ✅ Show character codes to detect hidden characters
            userCharCodes: user?.username ? Array.from(user.username).map(c => c.charCodeAt(0)) : [],
            playerCharCodes: p?.username ? Array.from(p.username).map(c => c.charCodeAt(0)) : []
        })),
        actualPlayersUsernames: players.map(p => p?.username)
    });
    
    const isPlayer = players.some(p => p?.username === user?.username);
    console.log('GameEndOverlay: isCurrentUserPlayer final result:', {
        userUsername: user?.username,
        playersUsernames: players.map(p => p?.username),
        isPlayer
    });
    
    return isPlayer;
}, [user, players, gameState?.timestamp]); // ✅ Add timestamp dependency



    // Calculate scores excluding cards in spreads
    const calculatePlayerScore = useCallback((playerIndex) => {
        const hand = gameState?.playerHands?.[playerIndex] || [];
        const spreads = gameState?.playerSpreads?.[playerIndex] || [];
        
        // Get all cards that are in spreads
        const spreadCards = spreads.flat();
        
        // Only count cards that are still in hand (not in spreads)
        return hand.reduce((total, card) => {
            const isInSpread = spreadCards.some(spreadCard => 
                spreadCard.rank === card.rank && spreadCard.suit === card.suit
            );
            return isInSpread ? total : total + (CARD_VALUES[card.rank] || 0);
        }, 0);
    }, [gameState]);
   
    const handlePlayAgain = useCallback(() => {
        if (socket && user?.username && (isCurrentUserPlayer() || isSpectator)) {
            console.log('GameEndOverlay: Emitting player_ready for user:', user.username, 'isSpectator:', isSpectator);
            socket.emit('player_ready', { tableId, username: user.username });
            setHasPlayerReadied(true);
        }
    }, [socket, tableId, user?.username, isCurrentUserPlayer, isSpectator]);
   
     // ✅ Listen for ready player updates


    

const getWinMessage = () => {
    const winnerNames = winners
        .map(index => players[index]?.username || 'AI Player')
        .join(', ');


    // Use the 'reason' prop if available for a more specific message
    if (reason) {
        switch (reason) {
            case 'TONK':
                return `${winnerNames} wins by Tonk!`;
            case 'STOCK_EMPTY':
                const isMultipleWinners = winners.length > 1;
                return `Stock Empty! ${winnerNames} ${isMultipleWinners ? 'tie' : 'wins'} with lowest points!`;
            case 'DROP':
                return `${winnerNames} wins by Drop!`;
            case 'CAUGHT':
                return `${winnerNames} caught the dropper!`;
            case 'FORFEIT':
                return `${winnerNames} wins by forfeit!`;
            default:
                return `Game Over: ${reason}`;
        }
    }


    switch (winType) {
        case 'DROP_CAUGHT':
            return `Drop Caught! ${winnerNames} wins ${baseStake * 2} chips from the dropper!`;
        case 'DROP_WIN':
            return `Successful Drop by ${winnerNames}! Wins ${potSize} chips`;
        case 'REEM':
            return `REEM! ${winnerNames} wins ${potSize * 2} chips with two spreads!`;
        case 'IMMEDIATE_50_WIN':
            return `${winnerNames} wins ${potSize * 2} chips with a score of 50!`;
            case 'SPECIAL_WIN':
                // Calculate the winner's actual score to determine if it's 41 or 11-or-under
                const winnerScore = winners.length > 0 ? calculatePlayerScore(winners[0]) : 0;
                if (winnerScore === 41) {
                    return `${winnerNames} wins ${potSize * 3} chips with a perfect score of 41!`;
                } else if (winnerScore === 11) {
                    return `${winnerNames} wins ${potSize * 3} chips with a score of exactly 11!`;
                } else if (winnerScore < 11) {
                    return `${winnerNames} wins ${potSize * 3} chips with a score of ${winnerScore} (under 11)!`;
                }
        case 'STOCK_EMPTY':
            const isMultipleWinners = winners.length > 1;
            return `Deck Empty - ${winnerNames} ${isMultipleWinners ? 'tie' : 'wins'} with lowest points! ${isMultipleWinners ? `Split pot: ${potSize / winners.length} chips each` : `Wins ${potSize} chips`}`;
        case 'REGULAR_WIN':
            return `${winnerNames} wins ${potSize} chips by going out first!`;
        case 'FORFEIT_WIN':
            return `${winnerNames} wins by forfeit — other player left the game.`;
        default:
            return `${winnerNames} wins ${potSize} chips!`;
    }
};

const handleLeaveTable = async () => {
    try {
        if (socket && user?.username) {
            socket.emit('leave_table', { 
                tableId, 
                username: user.username
            });
        }
        // ✅ Also call the REST endpoint to ensure DB is updated
        await AuthService.leaveTable(tableId, user.username);
        navigate('/lobby');
    } catch (error) {
        console.error('Error leaving table:', error);
    }
};

const userIsPlayer = isCurrentUserPlayer();

   
   

return (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 backdrop-blur-sm p-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl max-w-xl w-full text-white border border-gray-700 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-center text-3xl font-extrabold mb-4 text-yellow-400 drop-shadow-lg">{getWinMessage()}</h2>
                    {reason && reason !== 'TONK' && reason !== 'DROP' && reason !== 'CAUGHT' && reason !== 'FORFEIT' && (
                        <p className="text-center text-lg text-gray-300 mb-4">Reason: {reason}</p>
                    )}

                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-700 rounded">
                            Debug: User: {user?.username} | Players: {players.map(p => p?.username).join(', ')} | IsPlayer: {userIsPlayer.toString()}
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="text-xl font-bold mb-3 text-center text-gray-200">Final Scores (Hand Cards Only)</h3>
                        <div className="bg-gray-800 p-3 rounded-lg shadow-inner">
                            {players.map((player, index) => (
                                <ScoreDisplay
                                    key={`${player.username}-${index}-${gameState?.timestamp || Date.now()}`}
                                    player={player}
                                    index={index}
                                    score={calculatePlayerScore(index)}
                                    isWinner={winners.includes(index)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3 text-center text-gray-200">Pot Details</h3>
                        <div className="bg-gray-800 p-3 rounded-lg shadow-inner text-center">
                            <p className="text-base mb-1">Table Stake: <span className="font-semibold text-yellow-300">{stake}</span> chips</p>
                            <p className="text-base mb-1">Total Pot: <span className="font-semibold text-yellow-300">{stake * players.length}</span> chips</p>
                            {winType === 'REEM' && <p className="text-lg font-bold text-green-400 animate-pulse mt-2">REEM Bonus: Double pot!</p>}
                            {winType === '50' && <p className="text-lg font-bold text-green-400 animate-pulse mt-2">50 Bonus: Double pot!</p>}
                            {winType === '41or11' && <p className="text-lg font-bold text-green-400 animate-pulse mt-2">41 or 11 Bonus: Triple pot!</p>}
                            {winType === 'DROP_CAUGHT' && <p className="text-lg font-bold text-red-400 animate-pulse mt-2">Drop Penalty: Double stake from dropper</p>}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <button
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                            onClick={handlePlayAgain}
                            disabled={(!userIsPlayer && !isSpectator) || hasPlayerReadied}
                        >
                            {hasPlayerReadied ? 'Waiting for game...' : (isSpectator ? 'Ready to Join' : 'Play Again')}
                        </button>
                        {countdown > 0 && !hasPlayerReadied && (
                            <div className="flex items-center text-base text-gray-300 justify-center sm:justify-start">
                                Auto-starting in <span className="font-bold text-yellow-400 ml-2">{countdown}s</span>
                            </div>
                        )}
                        <button
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 text-base"
                            onClick={handleLeaveTable}
                        >
                            Leave Table
                        </button>
                    </div>
        </div>
    </div>
);
};

// Update PropTypes
GameEndOverlay.propTypes = {
    winners: PropTypes.array,
    players: PropTypes.array,
    playerHands: PropTypes.array,
    winType: PropTypes.string,
    caught: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    stake: PropTypes.number,
    gameState: PropTypes.object,
    setGameState: PropTypes.func,
    tableId: PropTypes.string,
    onGameRestart: PropTypes.func,
    socket: PropTypes.object,
    isSpectator: PropTypes.bool,
    user: PropTypes.object, // ✅ Add user prop type
    finalScores: PropTypes.array, // Add prop type for finalScores
    reason: PropTypes.string // Add prop type for reason
};

// Provide default props
GameEndOverlay.defaultProps = {
    winners: [],
    players: [],
    playerHands: [],
    winType: null,
    caught: null,
    stake: 0,
    gameState: {},
    setGameState: () => {},
    tableId: '',
    onGameRestart: () => {},
    socket: null,
    isSpectator: false,
    user: null, // ✅ Add default user prop
    finalScores: [],
    reason: null
};

export default GameEndOverlay;

