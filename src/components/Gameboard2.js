import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import PlayerHand from './PlayerHand';
import Deck from './Deck';
import './GameBoard.css';
import axios from 'axios';

//import LoginPage from './LoginPage';

const stakesOptions = [1, 5, 10, 20, 50, 100];

const GameBoard = ({ user }) => {
    const navigate = useNavigate();
    const [playerChips, setPlayerChips] = useState(0);
    const [stake, setStake] = useState(1);
    const [stakeWon, setStakeWon] = useState(null); // Add this state variable
    const [stakeSet, setStakeSet] = useState(false); // Flag to track if stake has been set
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [playerHands, setPlayerHands] = useState([]);
    const [deck, setDeck] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [hasDrawnCard, setHasDrawnCard] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [playerSpreads, setPlayerSpreads] = useState([[], []]);
    const [hasValidSpread, setHasValidSpread] = useState(false);
    const [successfulSpreads, setSuccessfulSpreads] = useState(new Array(playerHands.length).fill(0));
    const [hasValidHit, setHasValidHit] = useState(false);
    const [gameStarted, setGameStarted] = useState(false); // Game start flag
    const [winningPoints, setWinningPoints] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [username, setUsername] = useState(null);
    const [pot, setPot] = useState(0); // State for pot
    const [players, setPlayers] = useState([]); // Add players state








  
        const fetchData = async () => {
            try {
              const response = await AuthService.getCurrentUser();      
              console.log('User data:', response);
          
              if (response && response.user) {
                const user = response.user; // Access the nested user object
                setIsLoggedIn(true);
                setUsername(user.username);      
                setPlayerChips(user.chips); 
                setPlayers([...players, { username: user.username, chips: user.chips }]);     
              } else {
                navigate('/'); // Redirect if user not logged in
              }
              initializeGame(); // Initialize game state
            } catch (error) {
              console.error('Error fetching data:', error);
              navigate('/'); // Redirect if an error occurs
            }
          };
          
          useEffect(() => {
            fetchData();
          }, [navigate]); 

          useEffect(() => {
            // Add AI player if there is only one human player
            if (players.length === 1) {
                setPlayers([...players, createAIPlayer()]);
            }
        }, [players]);
          
      
    


    // Function to handle stake change
    const handleStakeChange = (newStake) => {
        if (!gameStarted) { // Allow stake change only if game hasn't started
            setStake(newStake);
        }
    };

    // Start game logic updated to ensure minimum 2 players
    const handleStartGame = () => {
        if (stake && players.length >= minPlayers) {
            initializeGame();
            setGameStarted(true);
            const updatedPlayerChips = playerChips - stake;
            setPlayerChips(updatedPlayerChips);
            updatePot(stake);
        } else {
            alert("Please set the stake and ensure at least 2 players before starting the game.");
        }
    };
      
    const handlePaymentSuccess = (nonce) => {
        // Call your backend to process the payment with nonce
        fetch('/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nonce,
                amount: stake * 100, // Amount in cents (100.00 USD)
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    handleBuyChips(currentTurn, stake);
                } else {
                    alert('Payment failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Payment failed');
            });
    };

    const handleBuyChips = (playerIndex, amount) => {
        const updatedChips = [...playerChips];
        updatedChips[playerIndex] += amount;
        setPlayerChips(updatedChips);
    };

    const initialDeck = [
        { rank: '2', suit: 'Hearts' }, { rank: '2', suit: 'Diamonds' },
        { rank: '2', suit: 'Clubs' }, { rank: '2', suit: 'Spades' },
        { rank: '3', suit: 'Hearts' }, { rank: '3', suit: 'Diamonds' },
        { rank: '3', suit: 'Clubs' }, { rank: '3', suit: 'Spades' },
        { rank: '4', suit: 'Hearts' }, { rank: '4', suit: 'Diamonds' },
        { rank: '4', suit: 'Clubs' }, { rank: '4', suit: 'Spades' },
        { rank: '5', suit: 'Hearts' }, { rank: '5', suit: 'Diamonds' },
        { rank: '5', suit: 'Clubs' }, { rank: '5', suit: 'Spades' },
        { rank: '6', suit: 'Hearts' }, { rank: '6', suit: 'Diamonds' },
        { rank: '6', suit: 'Clubs' }, { rank: '6', suit: 'Spades' },
        { rank: '7', suit: 'Hearts' }, { rank: '7', suit: 'Diamonds' },
        { rank: '7', suit: 'Clubs' }, { rank: '7', suit: 'Spades' },
        { rank: 'J', suit: 'Hearts' }, { rank: 'J', suit: 'Diamonds' },
        { rank: 'J', suit: 'Clubs' }, { rank: 'J', suit: 'Spades' },
        { rank: 'Q', suit: 'Hearts' }, { rank: 'Q', suit: 'Diamonds' },
        { rank: 'Q', suit: 'Clubs' }, { rank: 'Q', suit: 'Spades' },
        { rank: 'K', suit: 'Hearts' }, { rank: 'K', suit: 'Diamonds' },
        { rank: 'K', suit: 'Clubs' }, { rank: 'K', suit: 'Spades' },
        { rank: 'ace', suit: 'Hearts' }, { rank: 'ace', suit: 'Diamonds' },
        { rank: 'ace', suit: 'Clubs' }, { rank: 'ace', suit: 'Spades' }
    ];

    const initialPlayerCount = 2; // Number of players


    

    useEffect(() => {
        // Call CheckForValidHit whenever relevant state changes
       // updateHasValidHit();
        checkForValidSpread();
    }, [playerHands, currentTurn]);

    // Updated initializeGame to handle dynamic player count
    const initializeGame = async () => {
        const shuffledDeck = shuffleDeck([...initialDeck]);
        const dealtHands = dealHands(shuffledDeck, players.length);
        setDeck(shuffledDeck);
        setPlayerHands(dealtHands);
    
        const createNewGame = async () => {
            const token = localStorage.getItem('token');
            try {
                const currentUser = await AuthService.getCurrentUser();
                if (!currentUser || !currentUser.user) {
                    console.error('User or user id is undefined:', currentUser);
                    return;
                }
        
                const response = await axios.post('http://localhost:3000/games', {
                    player1: currentUser.username,
                    player2: players.length > 1 ? players[1].username : 'AI',
                    date: new Date(),
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGameId(response.data._id);
            } catch (error) {
                console.error('Failed to create game:', error);
            }
        };
    
        createNewGame();
    };

    // Handle player joining the game
    const handleJoinGame = (newPlayer) => {
        if (players.length < maxPlayers) {
            setPlayers([...players, newPlayer]);
        } else {
            alert("Game is full. Maximum 4 players allowed.");
        }
    };

    

    const shuffleDeck = (deck) => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const dealHands = (shuffledDeck, playerCount) => {
        const hands = Array.from({ length: playerCount }, () => []);
        for (let i = 0; i < 5; i++) { // Deal 5 cards to each player
            for (let j = 0; j < playerCount; j++) {
                if (shuffledDeck.length > 0) {
                    hands[j].push(shuffledDeck.pop());
                }
            }
        }
        return hands;
    };

    const drawCard = () => {
        if (!gameOver && !hasDrawnCard) {
            const updatedPlayerHands = [...playerHands];
            const updatedDeck = [...deck];
            if (updatedDeck.length > 0) {
                updatedPlayerHands[currentTurn] = [...updatedPlayerHands[currentTurn], updatedDeck.pop()];
                setPlayerHands(updatedPlayerHands);
                setDeck(updatedDeck);
                setHasDrawnCard(true);
            } else {
                endGame();
            }
        }
    };

    const drawFromDiscardPile = () => {
        if (!gameOver && !hasDrawnCard && discardPile.length > 0) {
            const updatedPlayerHands = [...playerHands];
            const updatedDiscardPile = [...discardPile];
            updatedPlayerHands[currentTurn] = [...updatedPlayerHands[currentTurn], updatedDiscardPile.pop()];
            setPlayerHands(updatedPlayerHands);
            setDiscardPile(updatedDiscardPile);
            setHasDrawnCard(true);
        }
    };

    const discardCard = (cardIndex) => {
        if (!gameOver && hasDrawnCard) {
            const updatedPlayerHands = [...playerHands];
            const cardToDiscard = updatedPlayerHands[currentTurn][cardIndex];
            updatedPlayerHands[currentTurn] = updatedPlayerHands[currentTurn].filter((card, index) => index !== cardIndex);
            const updatedDiscardPile = [...discardPile, cardToDiscard];
            setPlayerHands(updatedPlayerHands);
            setDiscardPile(updatedDiscardPile);
            setHasDrawnCard(false);
            checkForWinner(updatedPlayerHands);
            nextTurn();
        }
    };

    const nextTurn = () => {
        setCurrentTurn((prevTurn) => (prevTurn + 1) % playerHands.length); // Rotate turns
    };

    const checkForWinner = (updatedPlayerHands) => {
        updatedPlayerHands.forEach((hand, index) => {
            if (hand.length === 0) {
                setGameOver(true);
                setWinner(index);
                handleChipsUpdate(index, pot); // Winner takes the pot
            }
        });
    };
    const handleDiscardPileClick = () => {
        if (!hasDrawnCard) {
            drawFromDiscardPile();
        }
    };

    
    

    const checkForValidSpread = () => {
        // Check if the current player has a valid spread
        const currentPlayerHand = playerHands[currentTurn];
        const isValid = isValidSpread(currentPlayerHand);
        setHasValidSpread(isValid);
    };

    const updateHasValidHit = () => {
        const currentPlayerHand = playerHands[currentTurn];
        const isValid = CheckForValidHit(currentPlayerHand);
        setHasValidHit(isValid);
      };



    const isValidSpread = (hand) => {

        // Ensure hand is defined and an array
  if (!hand || !Array.isArray(hand)) {
    return false;
  }
        const cardCount = {};
        const suitRuns = {};
    
        // Initialize card count and suit runs
        hand.forEach((card) => {
            cardCount[card.rank] = (cardCount[card.rank] || 0) + 1;
            if (!suitRuns[card.suit]) {
                suitRuns[card.suit] = [];
            }
            suitRuns[card.suit].push(card);
        });
    
        // Check for three of a kind
        const hasThreeOfAKind = Object.values(cardCount).some((count) => count >= 3);
    
        // Check for runs of three in the same suit
        const hasSuitRun = Object.keys(suitRuns).some((suit) => {
            const sortedCards = suitRuns[suit].sort((a, b) => {
                return ['A','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(a.rank) - ['A','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(b.rank);
            });
            for (let i = 0; i < sortedCards.length - 2; i++) {
                const run = sortedCards.slice(i, i + 3);
                if (run.length === 3 &&
                    ['ace','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K' ].indexOf(run[0].rank) + 1 === ['ace','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) &&
                    ['ace','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) + 1 === ['ace','2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[2].rank)) {
                    return true;
                }
            }
            return false;
        });

        const hasTwoSpreads = Object.values(cardCount).filter(count => count >= 3).length >= 2;

    
        return hasThreeOfAKind || hasSuitRun || hasTwoSpreads;
    };

    
    
    const hasTwoSpreads = (playerSpreads) => {
        return playerSpreads && Array.isArray(playerSpreads) && playerSpreads.length === 2;
    };
    
    const handleSpread = () => {
        if (hasValidSpread) {
            const updatedPlayerHands = [...playerHands];
            const updatedPlayerSpreads = [...playerSpreads];
    
            if (!Array.isArray(updatedPlayerSpreads[currentTurn])) {
                updatedPlayerSpreads[currentTurn] = [];
            }
    
            const currentPlayerHand = updatedPlayerHands[currentTurn];
            let spread = [];
            // Iterate through the player's hand to find and remove valid spread cards
            for (let i = currentPlayerHand.length - 1; i >= 0; i--) {
                const card = currentPlayerHand[i];
                const cardCount = currentPlayerHand.filter((c) => c.rank === card.rank).length;
                if (cardCount >= 3 && !spread.find((c) => c.rank === card.rank)) {
                    spread.push(...currentPlayerHand.filter((c) => c.rank === card.rank));
                    updatedPlayerHands[currentTurn] = updatedPlayerHands[currentTurn].filter((c) => c.rank !== card.rank);
                }
            }

    
            // Check for three of a kind
            if (isValidSpread(currentPlayerHand)) {
                for (let i = currentPlayerHand.length - 1; i >= 0; i--) {
                    const card = currentPlayerHand[i];
                    const cardCount = currentPlayerHand.filter((c) => c.rank === card.rank).length;
                    if (cardCount >= 3 && spread.length === 0) {
                        spread = currentPlayerHand.filter((c) => c.rank === card.rank).slice(0, 3);
                        updatedPlayerHands[currentTurn] = updatedPlayerHands[currentTurn].filter((c) => c.rank !== card.rank).concat(currentPlayerHand.filter((c, index) => c.rank === card.rank && index >= 3));
                    }
                }
    
                // Check for runs of three in the same suit if no three of a kind found
                    const suitRuns = {};
                    currentPlayerHand.forEach((card) => {
                        if (!suitRuns[card.suit]) {
                            suitRuns[card.suit] = [];
                        }
                        suitRuns[card.suit].push(card);
                    });
    
                    Object.keys(suitRuns).forEach((suit) => {
                        const sortedCards = suitRuns[suit].sort((a, b) => {
                            return ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(a.rank) - ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(b.rank);
                        });
                        for (let i = 0; i < sortedCards.length - 2; i++) {
                            const run = sortedCards.slice(i, i + 3);
                            if (run.length === 3 &&
                                ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(run[0].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(run[1].rank) &&
                                ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(run[1].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(run[2].rank)) {
                                spread = run;
                                run.forEach(card => {
                                    const index = updatedPlayerHands[currentTurn].indexOf(card);
                                    if (index > -1) {
                                        updatedPlayerHands[currentTurn].splice(index, 1);
                                    }
                                });
                                break;
                            }
                        }
                    });
                
    
                    updatedPlayerSpreads[currentTurn].push(spread);
                    setPlayerHands(updatedPlayerHands);
                    setPlayerSpreads(updatedPlayerSpreads);

                    let stakeChange = stake;

                    
    
                    if (hasTwoSpreads(updatedPlayerSpreads[currentTurn])) {
                        console.log(`Game over! Player ${currentTurn} wins with 2 successful spreads.`);
                        const winnerIndex = currentTurn;
                        setGameOver(true);
                        setWinner(winnerIndex);
                        handleChipsUpdate(winnerIndex, pot *2);
                        stakeChange *= 2;
                        setStakeWon(stakeChange);
                    } else {
                        setHasValidSpread(false);

                    }
                
            } else {
                console.log("No valid spread found in the player's hand.");
            }
        }
    };
    
    
    
    
    
    
    
    
    const endGame = () => {
        setGameOver(true);
        alert('Game over! The deck is empty.');
    };

    const calculatePoints = (hand) => {
        const pointValues = { 'ace' : 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10 };
        return hand.reduce((sum, card) => sum + pointValues[card.rank], 0);
    };


    const handleDrop = (droppedPlayerIndex) => {
        const points = playerHands.map(hand => calculatePoints(hand));
        const lowestPoints = Math.min(...points);
        const winnerIndices = points.reduce((acc, point, index) => {
            if (point === lowestPoints) {
                acc.push(index);
            }
            return acc;
        }, []);
    
        // Set game over and declare the winner(s)
        setGameOver(true);
        setWinner(winnerIndices);
        setWinningPoints(lowestPoints);
    
        // Calculate and set stake won or lost
        let stakeChange = stake;
        playerHands.forEach((hand, index) => {
            const isWinner = winnerIndices.includes(index);
            const multiplier = isWinner ? 1 : -1;
            handleChipsUpdate(index, pot * multiplier);
            if (isWinner) {
                stakeChange *= 2;
            }
        });
        setStakeWon(stakeChange);
    };
    
    

    const hitSpread = (card, targetPlayerIndex, targetSpreadIndex) => {
        if (!gameOver) {
            const updatedPlayerHands = [...playerHands];
            const updatedPlayerSpreads = [...playerSpreads];
            const targetSpread = updatedPlayerSpreads[targetPlayerIndex][targetSpreadIndex];
    
            // Check if the card is a valid hit for the target spread
            if (isValidHit(card, targetSpread)) {
                // Remove the card from the current player's hand
                updatedPlayerHands[currentTurn] = updatedPlayerHands[currentTurn].filter(c => c !== card);
                
                // Add the card to the target spread
                updatedPlayerSpreads[targetPlayerIndex][targetSpreadIndex].push(card);
                
                // Update the turn wait for the target player
                if (!targetSpread.wait) {
                    targetSpread.wait = 2;
                } else {
                    targetSpread.wait += 1;
                }
    
                setPlayerHands(updatedPlayerHands);
                setPlayerSpreads(updatedPlayerSpreads);
                setHasDrawnCard(false); // Allow the current player to take another action
                checkForWinner(updatedPlayerHands);
                
    
                // Optionally, you can call nextTurn() here if you want the hit action to end the player's turn
            }
        }
    };

    // Helper function to check if a card is a valid hit for a spread
const isValidHit = (card, spread) => {
    if (spread.length === 0) return false;

    const spreadRank = spread[0].rank;
    const spreadSuit = spread[0].suit;
    
    // Check if the hit card matches the rank for a set
    const isSet = spread.every(c => c.rank === spreadRank);
    if (isSet && card.rank === spreadRank) {
        return true;
    }

    // Check for consecutive rank hit in the same suit for a run
    const ranks = ['ace','2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'Q', 'K'];
    const cardRankIndex = ranks.indexOf(card.rank);
    const spreadRankIndices = spread.map(c => ranks.indexOf(c.rank));
    const isRun = spread.every(c => c.suit === spreadSuit);

    if (isRun) {
        const minRankIndex = Math.min(...spreadRankIndices);
        const maxRankIndex = Math.max(...spreadRankIndices);

        if (card.suit === spreadSuit && (cardRankIndex === minRankIndex - 1 || cardRankIndex === maxRankIndex + 1)) {
            return true;
        }
    }

    return false;
};

const CheckForValidHit = () => {
    const currentPlayerHand = playerHands[currentTurn];
    if (!currentPlayerHand || !Array.isArray(currentPlayerHand)) {
            return false; // Return false if current player's hand is not valid
        }
    for (const card of currentPlayerHand) {
        for (let i = 0; i < playerSpreads.length; i++) {
            for (let j = 0; j < playerSpreads[i].length; j++) {
                if (isValidHit(card, playerSpreads[i][j])) {
                    return true;
                }
                

            }
        }
    }
    return false;
};

useEffect(() => {
    const intervalId = setInterval(() => {
        playerHands.forEach((hand, index) => {
            const spreadCount = countSpreads(hand);
            if (spreadCount === 2) {
                setGameOver(true);
                setWinner(index);
                handleChipsUpdate(index, 2 * stake);
            }
        });
    }, 5000); // Check every second

    return () => clearInterval(intervalId); // Clean up on unmount
}, [playerHands, stake]);

const countSpreads = (playerIndex) => {
   // console.log('playerSpreads:', playerSpreads);
   // console.log('playerIndex:', playerIndex);
    if (playerSpreads[playerIndex] !== undefined) {
      return playerSpreads[playerIndex].length;
    } else {
      //console.error('playerSpreads[playerIndex] is undefined for index:', playerIndex);
      return 0; // or any default value
    }
  };
  
  const handleNewGame = () => {
    // Reset game state here
    setGameStarted(false);
    setGameOver(false);
    setPlayerHands([[], []]);
    setPlayerSpreads([[], []]);
    setDeck(initialDeck);
    setDiscardPile([]);
    setCurrentTurn(0);
    setHasDrawnCard(false);
    // Deduct the stake amount from each player's chips
    const updatedPlayerChips = playerChips - stake;
    setPlayerChips(updatedPlayerChips);
};


    
    

const handleChipsUpdate = async (winnerIndex, multiplier = 1) => {
    const token = localStorage.getItem('token');
    let updatedChips;

    // Clone playerChips if it's an array, otherwise initialize updatedChips
    if (Array.isArray(playerChips)) {
        updatedChips = [...playerChips]; // Clone the array
        updatedChips[winnerIndex] += pot * multiplier;
    } else {
        updatedChips = playerChips + pot * multiplier;
    }

    // Update state with updatedChips
    setPlayerChips(updatedChips);

    try {
        // Adjust your endpoint URL according to your server's API
        const endpoint = `http://localhost:3000/users/${username}/updateChips`;

        // Make the PUT request
        await axios.put(endpoint, {
            username: username,
            chips: updatedChips, // Send updatedChips as the value to update
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

    } catch (error) {
        console.error('Error updating chips:', error);
    }
};

// Function to handle logout
const handleLogout = async () => {
    try {
        await AuthService.logout(); // Example: Call your logout function from AuthService
        navigate('/'); // Redirect to user profile page after logout
    } catch (error) {
        console.error('Logout failed:', error);
        // Handle error, e.g., show an error message
    }
};

 // Function to navigate back to user profile page
 const goToUserProfile = () => {
    navigate('/userprofile'); // Redirect to user profile page
};

if (!isLoggedIn) {
    return <div>Loading...</div>;
}    return (

        <div className="game-board">
            <div className="header">
                <h2>{`Welcome, ${username}`}</h2>
                <h3>{`${username} Chips: ${playerChips}`}</h3>
            </div>
            {!gameStarted && (
                <div className="start-game">
                    <label htmlFor="stake">Stake:</label>
                    <select id="stake" value={stake || ''} onChange={(e) => handleStakeChange(Number(e.target.value))}>
                        <option value="">Select Stake</option>
                        {stakesOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>        
            )}
            {!gameStarted && (
                    <div className="join-game">
                        <h2>Join Game</h2>
                        {players.length < 4 && (
                            <button onClick={() => setPlayers([...players, username])}>Join as {username}</button>
                        )}
                        {players.length < 2 ? (
                            <p>Waiting for more players to join...</p>
                        ) : (
                            <button onClick={handleStartGame}>Start Game</button>
                        )}
                    </div>
                )}
            {gameStarted && (
                <div className="game-content">
                    <div className="player-section">
                        <h3>{`Player 1 Chips: ${playerChips}`}</h3>
                        <PlayerHand
                            cards={playerHands[0]}
                            handleCardClick={discardCard}
                            canDiscard={hasDrawnCard && currentTurn === 0}
                        />
                        <div className="spreads">
                            {playerSpreads[0] && playerSpreads[0].map((spread, spreadIndex) => (
                                <div key={spreadIndex} className="spread">
                                    {spread.map((card, cardIndex) => (
                                        <img
                                            key={cardIndex}
                                            src={`${process.env.PUBLIC_URL}/assets/cards/${card.rank}_of_${card.suit}.png`}
                                            alt={`${card.rank} of ${card.suit}`}
                                            className="card-image small"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="game-elements">
                        <Deck cards={deck || []} drawCard={drawCard} />
                        {gameOver && (
                        
                            <>
                                
                                <h2>{`Game Over! Player ${winner + 1} wins $${stakeWon} with low of ${winningPoints}`}</h2>
                                <button onClick={handleNewGame}>Start New Game</button>
                                <button onClick={handleLogout}>Logout</button>
                                <button onClick={goToUserProfile}>Go to Profile</button>


                       
                            </>

                        )}
                        <div className="discard-pile" onClick={handleDiscardPileClick}>
                            {discardPile.length > 0 && (
                                <img
                                    src={`${process.env.PUBLIC_URL}/assets/cards/${discardPile[discardPile.length - 1].rank}_of_${discardPile[discardPile.length - 1].suit}.png`}
                                    alt={`${discardPile[discardPile.length - 1].rank} of ${discardPile[discardPile.length - 1].suit}`}
                                    className="card-image"
                                />
                            )}
                        </div>
                        <div className="actions">
                            <button onClick={handleSpread} disabled={!hasValidSpread}>Spread</button>
                            <button onClick={handleDrop} disabled={hasDrawnCard}>Drop</button>
                            <button onClick={hitSpread} disabled={!hasValidHit}>Hit Spread</button>
                        </div>
                    </div>
                    <div className="player-section">
                        <h3>{`Player 2 Chips: ${playerChips}`}</h3>
                        <PlayerHand
                            cards={playerHands[1]}
                            handleCardClick={discardCard}
                            canDiscard={hasDrawnCard && currentTurn === 1}
                        />
                        <div className="spreads">
                            {playerSpreads[1] && playerSpreads[1].map((spread, spreadIndex) => (
                                <div key={spreadIndex} className="spread">
                                    {spread.map((card, cardIndex) => (
                                        <img
                                            key={cardIndex}
                                            src={`${process.env.PUBLIC_URL}/assets/cards/${card.rank}_of_${card.suit}.png`}
                                            alt={`${card.rank} of ${card.suit}`}
                                            className="card-image small"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    
};

export default GameBoard;
