import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from './UserContext';
import ChipSystem from '../utils/ChipSystem';

const PlayerInfo = ({ player = {}, isActive = false }) => {
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
        <div className={`player-info ${isActive ? 'active' : ''}`}>
            <div className="player-name">{player.username || 'Player'}</div>
            <div className="player-chips">
                <span className="chip-icon">💰</span>
                <span className="chip-count">{chipBalance}</span>
            </div>
            {isActive && <div className="turn-indicator">Current Turn</div>}
        </div>
    );
};

export default PlayerInfo;
