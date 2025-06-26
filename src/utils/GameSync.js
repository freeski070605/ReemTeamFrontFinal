
export const GameSync = {
    broadcastGameState: (socket, data) => {
        if (socket && socket.connected) {
            socket.emit('game_state_update', data);
        }
    }
};
