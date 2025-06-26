
export const gameValidations = {
    canDrop: (player, hitCounter, currentTurn) => {
        return hitCounter[currentTurn] === 0 && !player.hasDrawnCard;
    }
    // Add other validation methods as needed
};
