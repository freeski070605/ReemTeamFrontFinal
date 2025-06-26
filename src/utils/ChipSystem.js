import axios from 'axios';

class ChipSystem {
    
    static #processedTransactions = new Set();
    static #initializedGames = new Set();



    static async getChipBalance(username) {
    try {
        const response = await axios.get(
            `http://localhost:5000/users/${username}/balance`,
            { 
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}` 
                }
            }
        );
        return response.data.chips;
    } catch (error) {
        console.error('Failed to fetch chip balance:', error);
        throw new Error('Failed to fetch chip balance');
    }
}




    static async updateChips(username, amount, token, gameId = null, reason = null, onStateChange = null) {
        if (!username || username === 'AI Player') {
            console.log('AI Player chips are managed separately');
            return;
        }

        const transactionId = `${username}_${gameId}_${amount}_${Date.now()}`;
        if (this.#processedTransactions.has(transactionId)) {
            console.log('Transaction already processed:', transactionId);
            return;
        }

        try {
            const currentBalance = await this.getChipBalance(username);
            const newBalance = currentBalance + amount;

            const response = await axios.put(
                `http://localhost:5000/users/${username}/updateChips`,
                { 
                    chips: newBalance,
                    gameId,
                    reason,
                    transactionId
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            this.#processedTransactions.add(transactionId);
            console.log(`Updated chips for ${username}: ${currentBalance} → ${newBalance}`);
            
            if (onStateChange) {
                onStateChange({ hasChanged: true });
            }
            
            return response.data;
        } catch (error) {
            console.error('Chip update failed:', error);
            throw new Error('Failed to update chips');
        }
    }



    
    
static async handleGameStart(gameState) {
    // Generate unique game session ID if not exists
    if (!gameState.sessionId) {
        gameState.sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check both local and stored initialization state
    const storedInit = localStorage.getItem(`game_init_${gameState.sessionId}`);
    if (storedInit || this.#initializedGames.has(gameState.sessionId)) {
        console.log('Game already initialized:', gameState.sessionId);
        return true;
    }

    const stake = gameState.stake;
    const players = gameState.players;

    try {
        // Deduct initial stake from each player
        for (const player of players) {
            if (player.username === 'AI Player') continue;
            await this.updateChips(
                player.username,
                -stake,
                localStorage.getItem('token'),
                gameState.sessionId,
                'Game Start Stake'
            );
        }
        
        // Mark game as initialized both locally and in storage
        this.#initializedGames.add(gameState.sessionId);
        localStorage.setItem(`game_init_${gameState.sessionId}`, 'true');
        return true;
    } catch (error) {
        console.error('Error processing game start:', error);
        return false;
    }
}

static clearGameInitialization(sessionId) {
    this.#initializedGames.delete(sessionId);
    localStorage.removeItem(`game_init_${sessionId}`);
}

static startNewGame(gameState) {
    this.clearGameInitialization(gameState.sessionId);
    return this.handleGameStart(gameState);
}


    static async handleGameEnd(gameState, winners, winType) {
         // Validate gameState and required properties
    if (!gameState?.players || !Array.isArray(gameState.players)) {
        console.log('Invalid game state or players array');
        return false;
    }
        const stake = gameState.stake;
        const players = gameState.players;
        const pot = stake * players.length;

        // Validate winners array
    const validWinners = winners.filter(index => 
        index >= 0 && 
        index < players.length && 
        players[index]?.username
    );

        try {
            switch(winType) {
                case 'REEM':
                    for (const winnerIndex of validWinners) {
                        const winner = players[winnerIndex];
                        if (winner?.username === 'AI Player') continue;
                        await this.updateChips(
                            winner.username,
                            pot * 2,
                            localStorage.getItem('token'),
                            gameState.id,
                            'REEM Win - Double Stake'
                        );
                    }
                    break;
    
                case 'DROP_CAUGHT':
                    if (gameState.dropped !== undefined && players[gameState.dropped]) {
                        const dropper = players[gameState.dropped];
                        if (dropper.username !== 'AI Player') {
                            await this.updateChips(
                                dropper.username,
                                -(stake * 2 * validWinners.length),
                                localStorage.getItem('token'),
                                gameState.id,
                                'Drop Caught - Double Penalty'
                            );
                        }
                    }
                    
                    for (const winnerIndex of validWinners) {
                        const winner = players[winnerIndex];
                        if (winner?.username === 'AI Player') continue;
                        await this.updateChips(
                            winner.username,
                            stake * 2,
                            localStorage.getItem('token'),
                            gameState.id,
                            'Drop Caught Win'
                        );
                    }
                    break;

                case 'STOCK_EMPTY':
                    // Split pot among tied winners
                    const splitAmount = pot / winners.length;
                    for (const winnerIndex of winners) {
                        const winner = players[winnerIndex];
                        if (winner.username === 'AI Player') continue;
                        await this.updateChips(
                            winner.username,
                            splitAmount,
                            localStorage.getItem('token')
                        );
                    }
                    break;

                default:
                    // Regular win - single stake
                    for (const winnerIndex of winners) {
                        const winner = players[winnerIndex];
                        if (winner.username === 'AI Player') continue;
                        await this.updateChips(
                            winner.username,
                            pot,
                            localStorage.getItem('token')
                        );
                    }
            }
            for (const player of players) {
                if (player.username === 'AI Player') continue;
    
                const isWinner = winners.includes(players.indexOf(player));
                const earnings = isWinner ? (winType === 'REEM' ? stake * 2 : stake) : -stake;
    
                // Update user stats
                await axios.post(`http://localhost:5000/users/${player.username}/updateStats`, {
                    gameResult: isWinner ? (winType === 'REEM' ? 'reem' : 'win') : 'loss',
                    stake: stake,
                    earnings: earnings,
                    opponents: players.filter(p => p.username !== player.username).map(p => p.username)
                });
            }
            return true;
        } catch (error) {
            console.error('Error processing game end:', error);
            return false;
        }
    }

    static async validateStake(username, stakeAmount) {
        try {
            const balance = await this.getChipBalance(username, localStorage.getItem('token'));
            return balance >= stakeAmount;
        } catch (error) {
            console.error('Error validating stake:', error);
            return false;
        }
    }

    static async handleTie(gameState, tiedPlayers) {
        // In case of tie, return stakes to tied players
        const stake = gameState.stake;
        try {
            for (const playerIndex of tiedPlayers) {
                const player = gameState.players[playerIndex];
                if (player.username === 'AI Player') continue;
                await this.updateChips(
                    player.username,
                    stake,
                    localStorage.getItem('token')
                );
            }
            return true;
        } catch (error) {
            console.error('Error handling tie:', error);
            return false;
        }
    }
}

export default ChipSystem;
