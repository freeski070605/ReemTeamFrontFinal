import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfilePage.css';
import { UserContext } from './UserContext';
import CasinoChip from '../utils/casinoChip';

const UserProfilePage = () => {
  const { user, isLoading, updateUserChips } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    totalEarnings: 0,
    reemWins: 0
  });

  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      
      if (!user) {
        navigate('/login');
        return;
      }

      setPageLoading(true);
      await Promise.all([
        fetchGameHistory(),
        fetchUserStats()
      ]);
      setPageLoading(false);
    };

    loadData();
  }, [user, isLoading]);

  const fetchGameHistory = async () => {
    if (!user?.username) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/users/${user.username}/history`);
      setGameHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.username) return;

    try {
      const response = await axios.get(`http://localhost:5000/users/${user.username}/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };
  
  const recentGames = React.useMemo(() => {
    return gameHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [gameHistory]);

  if (loading || !user) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading profile data...</div>
      </div>
    );
  }

  const handleBuyChips = async (amount) => {
    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:5000/users/${user.username}/updateChips`, {
        chips: user.chips + amount
      });
      updateUserChips(response.data.chips);
      setFeedbackMessage(`Successfully purchased ${amount} chips!`);
    } catch (error) {
      setFeedbackMessage('Failed to purchase chips. Please try again.');
    }
    setLoading(false);
  };

  

  return (
    <div className="profile-container">
      <main className="content">
        <div className="profile-header">
          <h1>Welcome back, {user.username}!</h1>
          <div className="chips-display">
            <span className="chip-icon"><CasinoChip /></span>
            <span className="chip-amount">{user.chips}</span>
          </div>
        </div>

        <div className="profile-grid">
          <section className="stats-card">
            <h2>Player Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <h3>Games Played</h3>
                <p>{stats.gamesPlayed}</p>
              </div>
              <div className="stat-item">
                <h3>Wins</h3>
                <p>{stats.wins}</p>
              </div>
              <div className="stat-item">
                <h3>REEM Wins</h3>
                <p>{stats.reemWins}</p>
              </div>
              <div className="stat-item">
                <h3>Total Earnings</h3>
                <p>${stats.totalEarnings}</p>
              </div>
            </div>
          </section>

          <section className="chips-card">
            <h2>Buy Chips</h2>
            <div className="chips-options">
            {[1000, 5000, 10000, 50000].map(amount => (
              <button 
                key={amount}
                onClick={() => handleBuyChips(amount)}
                disabled={loading}
                className="chip-buy-button"
              >
                Buy {amount} <CasinoChip />
              </button>
            ))}
          </div>
            {feedbackMessage && <p className="feedback">{feedbackMessage}</p>}
          </section>

          <section className="recent-games">
            <h2>Recent Games</h2>
            <div className="games-list">
            {recentGames.map((game, index) => (
                <div key={index} className="game-item">
                  <span className="game-result">{game.result}</span>
                  <span className="game-stake">${game.earnings}</span>
                  <span className="game-date">{new Date(game.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="quick-actions">
            <button className="action-button primary" onClick={() => navigate('/lobby')}>
              Play Now
            </button>
            <button className="action-button secondary" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
