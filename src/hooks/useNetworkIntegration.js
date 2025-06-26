import { useCallback } from 'react';
import axios from 'axios';

export const useNetworkIntegration = () => {
    const updatePlayerChips = useCallback(async (username, amount) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/users/${username}/updateChips`,
                { chips: amount },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            return true;
        } catch (error) {
            console.error('Error updating chips:', error);
            return false;
        }
    }, []);

    const handleTableLeave = useCallback(async (tableId, username) => {
        try {
            await axios.post(`http://localhost:5000/tables/${tableId}/leave`, {
                username
            });
            return true;
        } catch (error) {
            console.error('Error leaving table:', error);
            return false;
        }
    }, []);

    return { updatePlayerChips, handleTableLeave };
};
