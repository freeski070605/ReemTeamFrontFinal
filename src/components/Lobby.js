import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { UserContext } from './UserContext';
import { SocketContext } from './SocketContext';
import './Lobby.css';
import CreateTableModal from './createTableModal';

const stakesOptions = [1, 5, 10, 20, 50, 100];

const Lobby = () => {
  const [tables, setTables] = useState([]);
  const [stake, setStake] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [queueStatus, setQueueStatus] = useState({});
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const { user, isLoading } = useContext(UserContext);
  const { socket, isConnected } = useContext(SocketContext);
  const navigate = useNavigate();

  // Filter tables by stake OR if user is seated
  const filteredTables = tables.filter(table =>
    !stake || table.stake === stake || table.players.some(p => p.username === user?.username)
  );

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/tables`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  }, []);
  const createTable = async (tableData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/tables`, {
        ...tableData,
        player: user
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const newTable = response.data.table;
      setTables(prevTables => [...prevTables, newTable]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const joinQueue = useCallback(async (stakeToJoin, tableId) => {
    if (!user || !user.username || !user.chips || isJoiningQueue) {
      console.warn('User not ready or already joining queue');
      return;
    }

    setIsJoiningQueue(true);

    try {
      // Check if user has enough chips
      if (user.chips < stakeToJoin) {
        alert(`Insufficient chips. You need $${stakeToJoin} to join this table.`);
        return;
      }

      if (socket) {
        socket.emit('join_queue', {
          stake: stakeToJoin,
          tableId: tableId,
          player: {
            username: user.username,
            chips: user.chips,
            isHuman: true
          }
        });
      }

      console.log(`Joining queue for stake: $${stakeToJoin}, tableId: ${tableId}`);
    } catch (error) {
      console.error('Error joining queue:', error);
    } finally {
      setIsJoiningQueue(false);
    }
  }, [user, isJoiningQueue]);

  const leaveQueue = useCallback((stakeToLeave) => {
    if (!user) return;

    if (socket) {
      socket.emit('leave_queue', {
        stake: stakeToLeave,
        username: user.username
      });
    }

    setQueueStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[stakeToLeave];
      return newStatus;
    });

    console.log(`Left queue for stake: $${stakeToLeave}`);
  }, [user]);

  const handleStakeChange = useCallback((newStake) => {
    setStake(newStake);
  }, []);

  useEffect(() => {
    fetchTables();

    // Socket event handlers
    const handleTablesUpdate = (data) => {
      setTables(data.tables || []);
    };

    const handleTableAssigned = (data) => {
      console.log('Table assigned:', data);
      // Clear queue status when assigned
      setQueueStatus({});
      navigate(`/table/${data.tableId}`);
    };

    // --- NEW: Handle spectator mode activation from backend ---
    const handleSpectatorModeActive = (data) => {
      console.log('Spectator mode activated (lobby):', data);
      setQueueStatus({});
      if (data.tableId) {
        navigate(`/table/${data.tableId}`);
      }
    };

    const handleQueueStatus = (data) => {
      setQueueStatus(prev => ({
        ...prev,
        [data.stake]: {
          position: data.position,
          queueSize: data.queueSize,
          estimatedWait: data.estimatedWait || 0
        }
      }));
    };

    // ✅ Add specific handler for leave_table results
  const handleLeaveTableResult = (data) => {
    if (!data.success) {
      console.error('Failed to leave table:', data.message);
      // Only show error if it's actually a failure
      alert(data.message || 'Failed to leave table');
    } else {
      console.log('Successfully left table:', data.message);
    }
  };

    const handleError = (error) => {
      console.error('Socket error:', error);
      alert(error.message || 'An error occurred');
      setIsJoiningQueue(false);
    };

    // Register socket listeners
    if (socket) {
      socket.on('tables_update', handleTablesUpdate);
      socket.on('table_assigned', handleTableAssigned);
      socket.on('queue_status', handleQueueStatus);
      socket.on('leave_table_result', handleLeaveTableResult);
      socket.on('error', handleError);
      // --- NEW: Listen for spectator_mode_active in the lobby ---
      socket.on('spectator_mode_active', handleSpectatorModeActive);
    }

    // Refresh tables when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) fetchTables();
    });

    return () => {
      if (socket) {
        socket.off('tables_update', handleTablesUpdate);
        socket.off('table_assigned', handleTableAssigned);
        socket.off('queue_status', handleQueueStatus);
        socket.off('leave_table_result', handleLeaveTableResult);
        socket.off('error', handleError);
        // --- NEW: Unregister spectator_mode_active handler ---
        socket.off('spectator_mode_active', handleSpectatorModeActive);
      }
      document.removeEventListener('visibilitychange', fetchTables);
    };
  }, [navigate, fetchTables]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Reem Team Tonk</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <span className="chips">Chips: ${user?.chips || 0}</span>
        </div>
      </div>

      <div className="stakes-selector">
        <button 
          className={`stake-button ${!stake ? 'selected' : ''}`} 
          onClick={() => handleStakeChange(null)}
        >
          All Stakes
        </button>
        {stakesOptions.map(option => (
          <button 
            key={option} 
            className={`stake-button ${stake === option ? 'selected' : ''}`}
            onClick={() => handleStakeChange(option)}
          >
            ${option}
          </button>
        ))}
      </div>

      {user?.isAdmin && (
        <div className="admin-controls">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Create New Table
          </button>
        </div>
      )}

      {showCreateModal && (
        <CreateTableModal 
          onClose={() => setShowCreateModal(false)} 
          onSubmit={createTable} 
        />
      )}

      <div className="tables-grid">
        {filteredTables.map(table => {
          const inQueue = queueStatus[table.stake];
          const isAtTable = table.players.some(p => p.username === user?.username);
          const isFull = table.players.length >= 4;
          const isPlaying = table.status === 'in_progress';
          const hasEnoughChips = user?.chips >= table.stake;

          return (
            <div key={table._id} className="table-card">
              <div className="table-preview">
                {table.players.map((p, i) => (
                  <div 
                    key={i} 
                    className={`mini-player ${['bottom','left','top','right'][i]} ${p.isHuman ? 'human' : 'ai'}`}
                  >
                    {p.username?.[0] || '?'}
                    {!p.isHuman && <span className="ai-indicator">AI</span>}
                  </div>
                ))}
                {Array.from({ length: 4 - table.players.length }).map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className={`mini-player empty ${['bottom','left','top','right'][table.players.length + i]}`}
                  >
                    ?
                  </div>
                ))}
              </div>

              <div className="table-info">
                <span className="stake-amount">${table.stake}</span>
                <span className="player-count">{table.players.length}/4 Players</span>
                <span className={`table-status ${table.status}`}>
                  {table.status === 'waiting' ? 'Waiting' : 'In Progress'}
                </span>
              </div>

              <div className="table-actions">
                <span className="table-name">{table.name}</span>
                
                {!isAtTable && !inQueue && (
                  <button 
                    className={`join-button ${!hasEnoughChips ? 'disabled' : ''}`}
                    onClick={() => joinQueue(table.stake, table._id)}
                    disabled={isJoiningQueue || !hasEnoughChips}
                  >
                    {isJoiningQueue ? 'Joining...' : `Join Queue ($${table.stake})`}
                  </button>
                )}

                {!hasEnoughChips && !isAtTable && !inQueue && (
                  <div className="insufficient-chips">
                    Need ${table.stake - (user?.chips || 0)} more chips
                  </div>
                )}

                {inQueue && (
                  <div className="queue-info">
                    <button 
                      className="leave-button" 
                      onClick={() => leaveQueue(table.stake)}
                    >
                      Leave Queue
                    </button>
                    <div className="queue-position">
                      Position: {inQueue.position}/{inQueue.queueSize}
                      {inQueue.estimatedWait > 0 && (
                        <div className="estimated-wait">
                          Est. wait: {inQueue.estimatedWait}s
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isAtTable && (
                  <div className="at-table-status">
                    <span className="seated-indicator">✓ Seated</span>
                    <button 
                      className="enter-table-button"
                      onClick={() => navigate(`/table/${table._id}`)}
                    >
                      Enter Table
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Status */}
      <div className="connection-indicator">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default Lobby;
