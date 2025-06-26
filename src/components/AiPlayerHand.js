class AiPlayer {
    constructor(username = 'AI', initialChips = 100) {
        this.username = username;
        this.chips = initialChips;
    }

    makeMove(hand, gameState) {
        console.log(`${this.username} is making a move...`);
        return this.calculateMove(hand, gameState);
    }

    calculateMove(hand, gameState) {
        const { discardPile, playerSpreads } = gameState;

        if (this.shouldDrop(hand, gameState)) {
            return { action: 'drop' };
        }

        const validHit = this.findValidHit(hand, playerSpreads);
        if (validHit) {
            return { action: 'hit', ...validHit };
        }

        if (!gameState.hasDrawnCard) {
            return {
                action: discardPile.length > 0 && Math.random() > 0.5 ? 'draw_deck' : 'draw_deck'
            };
        }

        if (this.hasValidSpread(hand)) {
            return { action: 'spread' };
        }

        if (gameState.hasDrawnCard && !gameState.hasValidHit && !gameState.hasValidSpread && !this.shouldDrop(hand, gameState)) {
            return { action: 'discard', cardIndex: this.findDiscardCardIndex(hand) };
        }

    }

    shouldDrop(hand, gameState) {
        const points = this.calculatePoints(hand);
        return points <= 5; // AI drops if points are 5 or less
    }

    findValidHit(hand, playerSpreads) {
        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            for (let j = 0; j < playerSpreads.length; j++) {
                for (let k = 0; k < playerSpreads[j].length; k++) {
                    if (this.isValidHit(card, playerSpreads[j][k])) {
                        return { card, targetPlayerIndex: j, targetSpreadIndex: k };
                    }
                }
            }
        }
        return null;
    }

    isValidHit(card, spread) {
        if (spread.length === 0) return false;

        const spreadRank = spread[0].rank;
        const spreadSuit = spread[0].suit;

        const isSet = spread.every(c => c.rank === spreadRank);
        if (isSet && card.rank === spreadRank) {
            return true;
        }

        const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
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
    }

    hasValidSpread(hand) {
        const cardCount = {};
        const suitRuns = {};

        hand.forEach((card) => {
            cardCount[card.rank] = (cardCount[card.rank] || 0) + 1;
            if (!suitRuns[card.suit]) {
                suitRuns[card.suit] = [];
            }
            suitRuns[card.suit].push(card);
        });

        const hasThreeOfAKind = Object.values(cardCount).some((count) => count >= 3);

        const hasSuitRun = Object.keys(suitRuns).some((suit) => {
            const sortedCards = suitRuns[suit].sort((a, b) => {
                return ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(a.rank) - ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(b.rank);
            });
            for (let i = 0; i < sortedCards.length - 2; i++) {
                const run = sortedCards.slice(i, i + 3);
                if (run.length === 3 &&
                    ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[0].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) &&
                    ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[2].rank)) {
                    return true;
                }
            }
            return false;
        });

        return hasThreeOfAKind || hasSuitRun;
    }

    findDiscardCardIndex(hand) {
        // Simple strategy: discard the first card that is not part of a spread
        const cardCount = {};
        const suitRuns = {};

        hand.forEach((card) => {
            cardCount[card.rank] = (cardCount[card.rank] || 0) + 1;
            if (!suitRuns[card.suit]) {
                suitRuns[card.suit] = [];
            }
            suitRuns[card.suit].push(card);
        });

        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            const rankCount = cardCount[card.rank];
            const suitRun = suitRuns[card.suit];

            if (rankCount < 3 && (suitRun.length < 3 || !this.isPartOfRun(card, suitRun))) {
                return i;
            }
        }

        return 0; // Default to discarding the first card
    }

    isPartOfRun(card, run) {
        const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
        const cardIndex = ranks.indexOf(card.rank);
        const runIndices = run.map(c => ranks.indexOf(c.rank));

        return runIndices.includes(cardIndex - 1) || runIndices.includes(cardIndex + 1);
    }

    calculatePoints(hand) {
        const pointValues = { 'ace': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10 };
        return hand.reduce((sum, card) => sum + pointValues[card.rank], 0);
    }

    updateChips(amount) {
        this.chips += amount;
    }
}

export default AiPlayer;
