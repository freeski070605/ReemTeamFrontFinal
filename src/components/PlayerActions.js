import React, { useMemo } from 'react';
import { 
    isValidSpread, 
    findBestSpread,
    handleSpread,
    handleHit,
    handleDrop,
    findValidHitForAi,
    handleGameEnd,
    isValidHit
} from '../utils/gameUtils';

const PlayerActions = ({ 
    gameState,
    setGameState,
    isActive,
    hasDrawnCard,
    canDrop,
    onActionComplete,
    onSpread,
    onHit,
    onToggleHitMode,
    isHitModeActive,
}) => {
    const canSpread = useMemo(() => {
        if (!isActive || !hasDrawnCard) return false;
        const hand = gameState.playerHands[gameState.currentTurn];
        const bestSpread = findBestSpread(hand);
        return bestSpread !== null && isValidSpread(bestSpread);
    }, [isActive, hasDrawnCard, gameState]);

    const canHit = useMemo(() => {
        if (!isActive || !hasDrawnCard) return false;
        const currentHand = gameState.playerHands[gameState.currentTurn];
        return gameState.playerSpreads.some((playerSpread) => 
            playerSpread.some((spread) => 
                currentHand.some(card => isValidHit(card, spread))
            )
        );
    }, [isActive, hasDrawnCard, gameState]);

    const handleSpreadAction = (e) => {
        e.preventDefault();
        console.log('Spread conditions:', {
            isActive,
            canSpread,
            hasDrawnCard,
            hand: gameState.playerHands[gameState.currentTurn],
            isProcessingAction: gameState.isProcessingAction
        });
        
        // ✅ Prevent multiple spread calls
        if (gameState.isProcessingAction) {
            console.log('🔄 Spread action already in progress, ignoring click');
            return;
        }
        
        if (isActive && canSpread) {
            const hand = gameState.playerHands[gameState.currentTurn];
            const spreadToMake = findBestSpread(hand);
            if (spreadToMake) {
                console.log('Making spread with:', spreadToMake);
                onSpread(spreadToMake);
            }
        }
    };
    
    const handleHitClick = () => {
        console.log('Hit button clicked');
        onToggleHitMode();
    };

    const handleHitAction = (e) => {
        e.preventDefault();
        if (!isActive || !hasDrawnCard || !canHit) return;
    
        const currentHand = gameState.playerHands[gameState.currentTurn];
        let hitExecuted = false;
    
        // Stop after first valid hit is found
        gameState.playerSpreads.forEach((playerSpread, playerIndex) => {
            if (hitExecuted) return;
            
            playerSpread.forEach((spread, spreadIndex) => {
                if (hitExecuted) return;
                
                currentHand.forEach((card, cardIndex) => {
                    if (hitExecuted) return;
                    
                    if (isValidHit(card, spread)) {
                        console.log('Valid hit found:', {
                            card, cardIndex, playerIndex, spreadIndex
                        });
                        onHit(cardIndex, playerIndex, spreadIndex);
                        hitExecuted = true;
                    }
                });
            });
        });
    };
    
    
    

    const handleDropAction = (e) => {
        e.preventDefault();
        if (isActive && canDrop && !hasDrawnCard) {
            handleDrop(gameState, setGameState);
            onActionComplete?.('DROP');
        }
    };

    return (
        <div className="flex gap-2 justify-center mt-3">
            <button
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200
                            ${!hasDrawnCard && canDrop && gameState.players[gameState.currentTurn]?.hitPenaltyRounds === 0
                                ? 'bg-success text-lightText hover:bg-green-700'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'}`}
                disabled={!isActive || hasDrawnCard || !canDrop || gameState.players[gameState.currentTurn]?.hitPenaltyRounds > 0}
                onClick={handleDropAction}
            >
                Drop {gameState.players[gameState.currentTurn]?.hitPenaltyRounds > 0 ? `(${gameState.players[gameState.currentTurn]?.hitPenaltyRounds})` : ''}
            </button>
            <button
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200
                            ${hasDrawnCard && canSpread && !gameState.isProcessingAction
                                ? 'bg-primary text-lightText hover:bg-blue-700'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'}`}
                disabled={!canSpread || gameState.isProcessingAction}
                onClick={handleSpreadAction}
            >
                {gameState.isProcessingAction ? 'Processing...' : 'Spread'}
            </button>
            <button
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200
                            ${isHitModeActive ? 'bg-secondary text-darkText' : 'bg-info text-lightText hover:bg-blue-500'}
                            ${!isActive || !hasDrawnCard || !canHit ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' : ''}`}
                onClick={handleHitClick}
                disabled={!isActive || !hasDrawnCard || !canHit}
            >
                Hit
            </button>
        </div>
    );
};

export default PlayerActions;
