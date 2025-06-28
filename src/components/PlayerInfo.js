import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from './UserContext';
import ChipSystem from '../utils/ChipSystem';

const PlayerInfo = ({ player = {}, isActive = false, handScore = null }) => {
    const { user } = useContext(UserContext);
    const [chipBalance, setChipBalance] = useState(player.chips);

    useEffect(() => {
        const updateChipBalance = async () => {
            if (player.username === user?.username) {
                const balance = await ChipSystem.getChipBalance(player.username);
                setChipBalance(balance);
            } else {
                setChipBalance(player.chips);
            }
        };

        updateChipBalance();
        const interval = setInterval(updateChipBalance, 2000);

        return () => clearInterval(interval);
    }, [player.username, player.chips, user?.username]);

    return (
        <div className={`bg-darkBackground/60 text-accentGold font-bold p-1 px-2 rounded-lg text-center shadow-sm w-32
                        ${isActive ? 'border-2 border-accentGold animate-pulse' : ''}`}>
            <div className="text-lg">{player.username || 'Player'}</div>
            <div className="flex items-center justify-center text-lightText text-md mt-1">
                <span className="mr-1">💰</span>
                <span>{chipBalance}</span>
            </div>
            {handScore !== null && (
                <div className="text-lightText text-md mt-1">
                    <span className="mr-1">🃏</span>
                    <span>Score: {handScore}</span>
                </div>
            )}
        </div>
    );
};

export default PlayerInfo;
