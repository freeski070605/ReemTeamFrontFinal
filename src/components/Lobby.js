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
  const [showTableAssignedNotification, setShowTableAssignedNotification] = useState(false);
  const [assignedTableId, setAssignedTableId] = useState(null);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const { user, isLoading } = useContext(UserContext);
  const { socket } = useContext(SocketContext);
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

      socket.emit('join_queue', {
        stake: stakeToJoin,
        tableId: tableId,
        player: {
          username: user.username,
          chips: user.chips,
          isHuman: true
        }
      });

      console.log(`Joining queue for stake: $${stakeToJoin}, tableId: ${tableId}`);
    } catch (error) {
      console.error('Error joining queue:', error);
    } finally {
      setIsJoiningQueue(false);
    }
  }, [user, isJoiningQueue]);

  const leaveQueue = useCallback((stakeToLeave) => {
    if (!user) return;

    socket.emit('leave_queue', {
      stake: stakeToLeave,
      username: user.username
    });

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
      setQueueStatus({}); // Clear queue status when assigned
      setAssignedTableId(data.tableId);
      setShowTableAssignedNotification(true);

      // Navigate after a short delay to allow the user to see the notification
      setTimeout(() => {
        setShowTableAssignedNotification(false);
        navigate(`/table/${data.tableId}`);
      }, 2000); // Show notification for 2 seconds
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
  }, [navigate, fetchTables, user, isLoading]); // Added user and isLoading to dependencies

  // Redirect if user is not logged in and loading is complete
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('User not logged in, redirecting to home page.');
      navigate('/');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) return <div className="loading">Loading...</div>;

  // Only render lobby content if user is logged in
  if (!user) return null; // Or a more explicit "Please log in" message if desired

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Reem Team Tonk</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <span className="chips">Chips: ${user.chips || 0}</span>
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

      <div className="queue-status-section bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-bold text-lightText mb-3">Your Queue Status</h2>
        {Object.keys(queueStatus).length > 0 ? (
          Object.entries(queueStatus).map(([stake, status]) => (
            <div key={stake} className="flex items-center justify-between bg-gray-700 p-3 rounded-md mb-2">
              <p className="text-lg text-accentGold font-semibold">Stake: ${stake}</p>
              <div className="flex items-center space-x-4">
                <p className="text-lightText">Position: <span className="font-bold">{status.position}/{status.queueSize}</span></p>
                {status.estimatedWait > 0 && (
                  <p className="text-lightText">Est. Wait: <span className="font-bold">{status.estimatedWait}s</span></p>
                )}
                <button
                  className="bg-accentRed text-lightText px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-200"
                  onClick={() => leaveQueue(parseInt(stake))}
                >
                  Leave Queue
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400">You are not currently in any queue.</p>
        )}
      </div>

      <div className="tables-grid">
        {filteredTables.map(table => {
          const inQueueForThisTable = queueStatus[table.stake] && queueStatus[table.stake].tableId === table._id;
          const isAtTable = table.players.some(p => p.username === user?.username);
          const isFull = table.players.length >= 4;
          const isPlaying = table.status === 'in_progress';
          const hasEnoughChips = user?.chips >= table.stake;
          const hasAIPlayers = table.players.some(p => !p.isHuman);

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
                {isFull && <span className="table-tag full">Full</span>}
                {hasAIPlayers && <span className="table-tag ai">AI Players</span>}
                {!isFull && !hasAIPlayers && <span className="table-tag joinable">Join Now</span>}
              </div>

              <div className="table-actions">
                <span className="table-name">{table.name}</span>
                
                {!isAtTable && !inQueueForThisTable && !isFull && (
                  <button
                    className={`join-button ${!hasEnoughChips ? 'disabled' : ''}`}
                    onClick={() => joinQueue(table.stake, table._id)}
                    disabled={isJoiningQueue || !hasEnoughChips || isFull}
                  >
                    {isJoiningQueue ? 'Joining...' : `Join Queue ($${table.stake})`}
                  </button>
                )}

                {!hasEnoughChips && !isAtTable && !inQueueForThisTable && (
                  <div className="insufficient-chips text-red-400 text-sm mt-2">
                    Need ${table.stake - (user?.chips || 0)} more chips. <Link to="/userprofile" className="text-primary hover:underline">Visit your profile to buy more.</Link>
                  </div>
                )}

                {inQueueForThisTable && (
                  <div className="queue-info bg-blue-800 text-lightText p-2 rounded-md mt-2">
                    <p className="font-semibold">In Queue:</p>
                    <p>Position: {queueStatus[table.stake].position}/{queueStatus[table.stake].queueSize}</p>
                    {queueStatus[table.stake].estimatedWait > 0 && (
                      <p>Est. wait: {queueStatus[table.stake].estimatedWait}s</p>
                    )}
                    <button
                      className="bg-accentRed text-lightText px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-200 mt-2"
                      onClick={() => leaveQueue(table.stake)}
                    >
                      Leave Queue
                    </button>
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
        <span className={`status ${socket && socket.connected ? 'connected' : 'disconnected'}`}>
          {socket && socket.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {showTableAssignedNotification && (
        <div className="fixed inset-0 bg-darkBackground bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-primary p-8 rounded-lg shadow-xl text-lightText text-center animate-pulse">
            <h2 className="text-3xl font-bold mb-4">Table Found!</h2>
            <p className="text-xl">Redirecting to Table {assignedTableId}...</p>
            <p className="text-sm mt-2">Get ready to play!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
