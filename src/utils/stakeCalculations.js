export const calculateStakeWinnings = (winType, stake, playerCount, winners) => {
    // Ensure stake is a number
    const baseStake = Number(stake) || 0;
    const totalPot = baseStake * (playerCount - 1);
    
    switch(winType) {
        case 'REEM':
            return totalPot * 2;
        case 'DROP_WIN':
            return totalPot;
        case 'DROP_CAUGHT':
            return totalPot * 2;  // Double stakes for caught drops
        case 'REGULAR_WIN':
            return totalPot;
        case 'STOCK_EMPTY':
            return winners.length > 1 ? totalPot / winners.length : totalPot;
        default:
            return totalPot;
    }
};
