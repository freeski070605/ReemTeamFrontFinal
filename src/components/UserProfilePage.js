import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from './UserContext';
import CasinoChip from '../utils/casinoChip';
import '../styles/tailwind.css'; // Ensure Tailwind is imported globally or in index.js

const UserProfilePage = () => {
  const { user, isLoading, updateUserChips } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const chipCountRef = useRef(null);
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
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/${user.username}/history`);
      setGameHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.username) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/${user.username}/stats`);
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

  if (pageLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl text-blue-400">
          <div className="animate-pulse">Loading profile data...</div>
          <div className="mt-4 space-y-4">
            <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-6 bg-gray-700 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleBuyChips = async (amount) => {
    setLoading(true);
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_BASE_URL}/users/${user.username}/updateChips`, {
        chips: user.chips + amount
      });
      updateUserChips(response.data.chips);
      setFeedbackMessage(`Successfully purchased ${amount} chips!`);
      // Trigger animation
      if (chipCountRef.current) {
        chipCountRef.current.classList.add('animate-chip-pulse');
        setTimeout(() => {
          chipCountRef.current.classList.remove('animate-chip-pulse');
        }, 1000); // Animation duration
      }
    } catch (error) {
      setFeedbackMessage('Failed to purchase chips. Please try again.');
    }
    setLoading(false);
  };

  

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
      <main className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 p-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 sm:mb-0 relative z-10">Welcome back, {user.username}!</h1>
          <div className="flex items-center space-x-3 bg-white bg-opacity-20 rounded-full px-5 py-2 shadow-md relative z-10">
            <span className="text-3xl text-yellow-300"><CasinoChip /></span>
            <span ref={chipCountRef} className="text-2xl font-bold text-white transition-all duration-300 ease-out">{user.chips}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-gray-700 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-blue-400 mb-5 pb-3 border-b border-gray-600">Player Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-600 rounded-lg p-5 text-center shadow-inner">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Games Played</h3>
                <p className="text-3xl font-bold text-teal-400">{stats.gamesPlayed}</p>
              </div>
              <div className="bg-gray-600 rounded-lg p-5 text-center shadow-inner">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Wins</h3>
                <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
              </div>
              <div className="bg-gray-600 rounded-lg p-5 text-center shadow-inner">
                <h3 className="text-lg font-medium text-gray-300 mb-2">REEM Wins</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.reemWins}</p>
              </div>
              <div className="bg-gray-600 rounded-lg p-5 text-center shadow-inner">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Total Earnings</h3>
                <p className="text-3xl font-bold text-yellow-400">${stats.totalEarnings}</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-700 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-blue-400 mb-5 pb-3 border-b border-gray-600">Buy Chips</h2>
            <div className="grid grid-cols-2 gap-4 mt-5">
              {[1000, 5000, 10000, 50000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleBuyChips(amount)}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Buy {amount}</span> <CasinoChip className="text-xl" />
                </button>
              ))}
            </div>
            {feedbackMessage && <p className="mt-5 p-3 bg-blue-800 text-blue-200 rounded-md text-center font-medium">{feedbackMessage}</p>}
          </section>

          <section className="lg:col-span-3 bg-gray-700 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-blue-400 mb-5 pb-3 border-b border-gray-600">Recent Games</h2>
            <div className="space-y-3 mt-5">
              {recentGames.length > 0 ? (
                recentGames.map((game, index) => (
                  <div key={index} className="flex flex-col sm:flex-row justify-between items-center bg-gray-600 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                      <span className={`font-semibold ${game.result === 'Win' ? 'text-green-400' : 'text-red-400'}`}>{game.result}</span>
                      <span className="text-sm text-gray-400">({game.gameId})</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-yellow-300">${game.earnings}</span>
                      <span className="text-sm text-gray-400">{new Date(game.date).toLocaleDateString()}</span>
                      {game.opponentNames && (
                        <span className="text-sm text-gray-400">vs. {game.opponentNames.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No recent games found.</p>
              )}
            </div>
          </section>

          <section className="lg:col-span-3 flex flex-col sm:flex-row justify-center gap-4 bg-gray-700 rounded-lg shadow-md p-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg w-full sm:w-auto" onClick={() => navigate('/lobby')}>
              Play Now
            </button>
            <button className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg w-full sm:w-auto" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;
