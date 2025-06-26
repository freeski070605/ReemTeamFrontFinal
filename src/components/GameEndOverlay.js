import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { shuffleDeck, dealHands, INITIAL_DECK } from '../utils/gameUtils';
import { CARD_VALUES } from './gameConstants';
import './GameEndOverlay.css';
import AuthService from "./AuthService";

const ScoreDisplay = ({ player, index, score, isWinner }) => (
    <div className={`player-score ${isWinner ? 'winner' : ''}`}>
        <span className="player-name">
            {player.username} {isWinner && '🏆'}
        </span>
        <span className="points">Points: {score}</span>
        {isWinner && <span className="winner-label">Winner!</span>}
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
    user 
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

    const baseStake = Number(stake);
    const potSize = baseStake * players.length;

    switch (winType) {
        case 'DROP_CAUGHT':
            return `Drop Caught! ${winnerNames} wins ${baseStake * 2} chips from the dropper!`;
        case 'DROP_WIN':
            return `Successful Drop by ${winnerNames}! Wins ${potSize} chips`;
        case 'REEM':
            return `REEM! ${winnerNames} wins ${potSize * 2} chips with two spreads!`;
        case '50':
            return `${winnerNames} wins ${potSize * 2} chips with a score of 50!`;
        case '41or11':
            return `${winnerNames} wins ${potSize * 3} chips with a score of 41 or 11 or under!`;
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
    <div className="game-end-overlay">
        <div className="game-end-content">
            <h2 className="win-message">{getWinMessage()}</h2>
            
            {/* ✅ Add debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '12px', color: '#666', margin: '10px 0' }}>
                    Debug: User: {user?.username} | Players: {players.map(p => p?.username).join(', ')} | IsPlayer: {userIsPlayer.toString()}
                </div>
            )}
            
            <div className="final-scores">
                <h3>Final Scores (Hand Cards Only)</h3>
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

            <div className="stake-info">
                <h3>Pot Details</h3>
                <p>Table Stake: {stake} chips</p>
                <p>Total Pot: {stake * players.length} chips</p>
                {winType === 'REEM' && <p>REEM Bonus: Double pot!</p>}
                                {winType === '50' && <p>50 Bonus: Double pot!</p>}
                                {winType === '41or11' && <p>41 or 11 Bonus: Triple pot!</p>}
                                {winType === 'DROP_CAUGHT' && <p>Drop Penalty: Double stake from dropper</p>}
            </div>

            <div className="action-buttons">
                <button
                    className="new-game-btn"
                    onClick={handlePlayAgain}
                    disabled={(!userIsPlayer && !isSpectator) || hasPlayerReadied}
                >
                    {hasPlayerReadied ? 'Waiting for game...' : (isSpectator ? 'Ready to Join' : 'Play Again')}
                </button>
                {countdown > 0 && !hasPlayerReadied && (
                    <div className="auto-start-info">
                        Auto-starting in {countdown}s
                    </div>
                )}
                <button 
                    className="leave-table"
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
    user: PropTypes.object // ✅ Add user prop type
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
    user: null // ✅ Add default user prop
};

export default GameEndOverlay;

