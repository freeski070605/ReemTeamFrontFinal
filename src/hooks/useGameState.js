import { useState, useEffect, useCallback } from 'react';
import { CARD_VALUES } from '../components/gameConstants';
import { shuffleDeck, dealHands, INITIAL_DECK, isValidHit } from '../utils/gameUtils';
import ChipSystem from '../utils/ChipSystem';

const calculateInitialScores = (hands) => {
    return hands.map(hand => 
        hand.reduce((total, card) => total + (CARD_VALUES[card.rank] || 0), 0)
    );
};

const useGameState = (initialState, tableId) => {
    const [gameState, setGameState] = useState(() => {
        const savedState = localStorage.getItem(`gameState_${tableId}`);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            return parsedState;
        }

        const players = initialState?.players.map(player => ({
            ...player,
            isAI: player.username === "AI Player"
        })) || [];

        const shuffledDeck = shuffleDeck([...INITIAL_DECK]);
        const initialHands = dealHands(shuffledDeck, players.length);

        return {
            ...initialState,
            players,
            playerHands: initialHands,
            playerSpreads: Array(players.length).fill().map(() => []),
            deck: shuffledDeck,
            discardPile: [],
            currentTurn: 0,
            hasDrawnCard: false,
            gameStarted: players.length > 0,
            stake: initialState?.stake || 0,
            pot: initialState?.stake * (initialState?.players?.length || 0),
            roundScores: calculateInitialScores(initialHands),
            gameOver: false,
            winners: [],
            winType: null,
            turnTimeLeft: 30,
            lastAction: null,
            aiTurnPhase: 'IDLE',
            readyPlayers: new Set(),
            isInitialized: true,
            penalties: {},
            requiresDiscard: false,
            chipBalances: {},
            dropped: null,
            caught: false,
            doubleStake: false
        };
    });

    const calculateFinalScores = useCallback((hands) => {
        return hands.map(hand => 
            hand.reduce((total, card) => total + (CARD_VALUES[card.rank] || 0), 0)
        );
    }, []);

    const handleEmptyDeck = useCallback((state) => {
        const scores = calculateFinalScores(state.playerHands);
        const minScore = Math.min(...scores);
        const winners = scores
            .map((score, index) => ({score, index}))
            .filter(({score}) => score === minScore)
            .map(({index}) => index);
        
        ChipSystem.handleGameEnd(state, winners, 'STOCK_EMPTY');
        
        return {
            ...state,
            gameOver: true,
            winners,
            winType: 'STOCK_EMPTY',
            roundScores: scores
        };
    }, [calculateFinalScores]);

    const handleHit = useCallback((cardIndex, targetIndex, spreadIndex) => {
        setGameState(prev => {
            const currentHand = [...prev.playerHands[prev.currentTurn]];
            const targetSpread = [...prev.playerSpreads[targetIndex][spreadIndex]];
            const card = currentHand[cardIndex];
    
            if (!isValidHit(card, targetSpread)) return prev;
    
            const newHands = prev.playerHands.map((hand, idx) => 
                idx === prev.currentTurn ? 
                    currentHand.filter((_, i) => i !== cardIndex) : 
                    [...hand]
            );
    
            const newSpreads = prev.playerSpreads.map((playerSpreads, idx) => 
                idx === targetIndex ? 
                    playerSpreads.map((spread, sIdx) => 
                        sIdx === spreadIndex ? 
                            [...spread, card] : 
                            [...spread]
                    ) : 
                    [...playerSpreads]
            );
    
            const updatedState = {
                ...prev,
                playerHands: newHands,
                playerSpreads: newSpreads,
                hasDrawnCard: true,
                requiresDiscard: true,
                lastAction: 'HIT'
            };

            if (newHands[prev.currentTurn].length === 0) {
                ChipSystem.handleGameEnd(updatedState, [prev.currentTurn], 'REGULAR_WIN');
                updatedState.gameOver = true;
                updatedState.winners = [prev.currentTurn];
                updatedState.winType = 'REGULAR_WIN';
            }
    
            localStorage.setItem(`gameState_${tableId}`, JSON.stringify(updatedState));
            return updatedState;
        });
    }, [tableId]);

    const setValidatedGameState = useCallback((updater) => {
        setGameState(prevState => {
            const newState = typeof updater === 'function' ? updater(prevState) : updater;
            const validatedState = {
                ...newState,
                players: newState.players?.map(player => ({...player})) || [],
                playerHands: Array.isArray(newState.playerHands) ? 
                    newState.playerHands.map(hand => [...hand]) : 
                    Array(newState.players?.length || 0).fill().map(() => []),
                playerSpreads: Array.isArray(newState.playerSpreads) ? 
                    newState.playerSpreads.map(spreads => 
                        spreads.map(spread => [...spread])
                    ) : 
                    Array(newState.players?.length || 0).fill().map(() => []),
                deck: Array.isArray(newState.deck) ? [...newState.deck] : [],
                discardPile: Array.isArray(newState.discardPile) ? [...newState.discardPile] : [],
                currentTurn: Math.max(0, Math.min(newState.currentTurn || 0, (newState.players?.length || 1) - 1)),
                hasDrawnCard: Boolean(newState.hasDrawnCard),
                gameOver: Boolean(newState.gameOver),
                gameStarted: Boolean(newState.gameStarted),
                stake: Number(newState.stake) || 0,
                pot: Number(newState.pot) || 0,
                turnTimeLeft: Number(newState.turnTimeLeft) || 30,
                winners: Array.isArray(newState.winners) ? [...newState.winners] : [],
                roundScores: Array.isArray(newState.roundScores) ? 
                    [...newState.roundScores] : 
                    calculateFinalScores(newState.playerHands),
                winType: newState.winType || null,
                readyPlayers: new Set(Array.from(newState.readyPlayers || [])),
                penalties: {...(newState.penalties || {})},
                chipBalances: {...(newState.chipBalances || {})},
                dropped: newState.dropped,
                caught: Boolean(newState.caught),
                doubleStake: Boolean(newState.doubleStake)
            };

            if (validatedState.deck.length === 0 && !validatedState.gameOver) {
                return handleEmptyDeck(validatedState);
            }

            localStorage.setItem(`gameState_${tableId}`, JSON.stringify(validatedState));
            return validatedState;
        });
    }, [calculateFinalScores, handleEmptyDeck, tableId]);

    const handleGameStart = useCallback(async () => {
        const success = await ChipSystem.handleGameStart(gameState);
        if (success) {
            setValidatedGameState(prev => ({
                ...prev,
                gameStarted: true
            }));
        }
    }, [gameState, setValidatedGameState]);

    const handleGameEnd = useCallback((currentState, winners, winType) => {
        const isSpecialWin = winType === 'REEM' || winType === 'DROP_CAUGHT';
        const updatedState = {
            ...currentState,
            gameOver: true,
            winners,
            winType,
            doubleStake: isSpecialWin,
            roundScores: calculateFinalScores(currentState.playerHands)
        };
    
        ChipSystem.handleGameEnd(updatedState, winners, winType);
        return updatedState;
    }, [calculateFinalScores]);

    const handleRestart = useCallback(() => {
    const newDeck = shuffleDeck([...INITIAL_DECK]);
    const initialHands = dealHands(newDeck, gameState.players.length);
    
    const freshState = {
        ...gameState,
        deck: newDeck,
        playerHands: initialHands,
        playerSpreads: Array(gameState.players.length).fill().map(() => []),
        discardPile: [],
        currentTurn: 0,
        hasDrawnCard: false,
        gameOver: false,
        gameStarted: true,
        winners: [],
        winType: null,
        timestamp: Date.now(),
        isInitialized: true
    };

    localStorage.removeItem(`gameState_${tableId}`);
    setValidatedGameState(freshState);
    return freshState;
}, [gameState, tableId, setValidatedGameState]);


    useEffect(() => {
        if (tableId && gameState.isInitialized) {
            localStorage.setItem(`gameState_${tableId}`, JSON.stringify(gameState));
        }
    }, [gameState, tableId]);



    return [gameState, setValidatedGameState, handleGameEnd, handleGameStart, handleHit, handleRestart];

    
};

export default useGameState;
