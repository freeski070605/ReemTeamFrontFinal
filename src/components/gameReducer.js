import { GAME_EVENTS, INITIAL_DECK } from './gameConstants';

export const initialGameState = {
    deck: [],
    discardPile: [],
    playerHands: [],
    currentTurn: 0,
    hasDrawnCard: false,
    gameOver: false,
    winner: null,
    playerSpreads: [],
    hitCounter: [],
    pot: 0,
    gameStarted: false,
    aiProcessing: false,
    gameEndMessage: '',
    drawnCard: null,
    drawnDiscardCard: null,
    players: [],
    stake: 0,
    roundNumber: 1,
    statusMessage: '',
    finalPoints: []
};

const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const dealHands = (deck, playerCount) => {
    const hands = Array(playerCount).fill().map(() => []);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < playerCount; j++) {
            if (deck.length > 0) {
                hands[j].push(deck.pop());
            }
        }
    }
    return hands;
};

export const gameReducer = (state, action) => {
    switch (action.type) {
        case 'INITIALIZE_GAME':
            const shuffledDeck = shuffleDeck([...INITIAL_DECK]);
            const dealtHands = dealHands(shuffledDeck, state.players.length);
            return {
                ...state,
                deck: shuffledDeck,
                playerHands: dealtHands,
                playerSpreads: Array(state.players.length).fill([]),
                hitCounter: Array(state.players.length).fill(0),
                pot: state.players.length * state.stake,
                gameStarted: true,
                gameOver: false,
                currentTurn: 0,
                hasDrawnCard: false
            };

        case GAME_EVENTS.DRAW:
            if (state.deck.length === 0) return state;
            const [drawnCard, ...remainingDeck] = state.deck;
            return {
                ...state,
                deck: remainingDeck,
                playerHands: state.playerHands.map((hand, idx) =>
                    idx === state.currentTurn ? [...hand, drawnCard] : hand
                ),
                hasDrawnCard: true,
                drawnCard
            };

        case GAME_EVENTS.DRAW_FROM_DISCARD:
            if (state.discardPile.length === 0) return state;
            const topCard = state.discardPile[state.discardPile.length - 1];
            return {
                ...state,
                discardPile: state.discardPile.slice(0, -1),
                playerHands: state.playerHands.map((hand, idx) =>
                    idx === state.currentTurn ? [...hand, topCard] : hand
                ),
                hasDrawnCard: true,
                drawnDiscardCard: topCard
            };

        case GAME_EVENTS.DISCARD:
            const { cardIndex } = action.payload;
            const currentHand = state.playerHands[state.currentTurn];
            const discardedCard = currentHand[cardIndex];
            
            return {
                ...state,
                playerHands: state.playerHands.map((hand, idx) =>
                    idx === state.currentTurn 
                        ? hand.filter((_, i) => i !== cardIndex)
                        : hand
                ),
                discardPile: [...state.discardPile, discardedCard],
                hasDrawnCard: false,
                drawnDiscardCard: null
            };

        case GAME_EVENTS.NEXT_TURN:
            return {
                ...state,
                currentTurn: action.payload.nextTurn,
                hasDrawnCard: false,
                drawnDiscardCard: null,
                hitCounter: action.payload.hitCounter,
                roundNumber: state.currentTurn === state.players.length - 1 
                    ? state.roundNumber + 1 
                    : state.roundNumber
            };

        case GAME_EVENTS.SPREAD:
            const { spreadCards } = action.payload;
            return {
                ...state,
                playerHands: state.playerHands.map((hand, idx) =>
                    idx === state.currentTurn 
                        ? hand.filter(card => !spreadCards.includes(card))
                        : hand
                ),
                playerSpreads: state.playerSpreads.map((spreads, idx) =>
                    idx === state.currentTurn 
                        ? [...spreads, spreadCards]
                        : spreads
                )
            };

        case GAME_EVENTS.HIT:
            const { hitCard, targetPlayer, targetSpread } = action.payload;
            return {
                ...state,
                playerHands: state.playerHands.map((hand, idx) =>
                    idx === state.currentTurn 
                        ? hand.filter(card => card !== hitCard)
                        : hand
                ),
                playerSpreads: state.playerSpreads.map((spreads, idx) =>
                    idx === targetPlayer
                        ? spreads.map((spread, i) =>
                            i === targetSpread ? [...spread, hitCard] : spread
                          )
                        : spreads
                ),
                hitCounter: state.hitCounter.map((count, idx) =>
                    idx === targetPlayer ? count + 1 : count
                )
            };

        case GAME_EVENTS.END_GAME:
            return {
                ...state,
                gameOver: true,
                winner: action.payload.winner,
                gameEndMessage: action.payload.message,
                finalPoints: action.payload.finalPoints,
                stakeWon: action.payload.stakeWon
            };

        case GAME_EVENTS.NEW_GAME:
            return {
                ...initialGameState,
                players: state.players,
                stake: state.stake
            };

        case 'START_AI_PROCESSING':
            return {
                ...state,
                aiProcessing: true
            };

        case 'END_AI_PROCESSING':
            return {
                ...state,
                aiProcessing: false
            };

        default:
            return state;
    }
};
