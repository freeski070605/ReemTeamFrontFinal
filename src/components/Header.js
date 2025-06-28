import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import LoginPage from './LoginPage';
import { Menu, X } from 'lucide-react'; // Import icons

import { UserContext } from './UserContext';
import ChipSystem from '../utils/ChipSystem';
import CasinoChip from '../utils/casinoChip';


const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const [chipBalance, setChipBalance] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const goToUserProfile = () => {
    navigate('/userprofile');
  };

  const handleLogin = async (username, password) => {
    try {
      const result = await AuthService.login(username, password);
      if (result.success) {
        setShowLoginModal(false);
        navigate('/userprofile');
      } else {
        alert(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null); // Clear user data on logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Real-time chip balance updates
  useEffect(() => {
    const updateChips = async () => {
        if (user?.username) {
            const balance = await ChipSystem.getChipBalance(user.username);
            setChipBalance(balance);
            setUser(prev => ({ ...prev, chips: balance }));
        }
    };

    updateChips();
    const interval = setInterval(updateChips, 4000);
    return () => clearInterval(interval);
}, [user?.username, setUser]);

  

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-3xl font-extrabold text-yellow-400 tracking-wide">REEM</span>
          <span className="text-3xl font-extrabold text-white tracking-wide">TEAM</span>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-md"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Navigation Section (Desktop & Mobile) */}
        <nav className={`md:flex md:items-center md:space-x-6 ${isMobileMenuOpen ? 'block absolute top-full left-0 right-0 bg-gray-800 p-4 shadow-md' : 'hidden'}`}>
          {user ? (
            <>
              {/* User Info & Chips */}
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 bg-gray-700 rounded-full px-4 py-2">
                <div className="flex items-center space-x-2 text-yellow-400 font-semibold text-lg">
                  <CasinoChip />
                  <span>{user.chips}</span>
                </div>
                <span className="text-white font-medium text-lg">{user.username}</span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
                <button
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/lobby')}
                >
                  Play Now
                </button>
                <button
                  className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/userprofile')}
                >
                  Profile
                </button>
                <button
                  className="px-5 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/rules')}
                >
                  Rules
                </button>
                {user.isAdmin && (
                  <button
                    className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition duration-300 ease-in-out shadow-md"
                    onClick={() => navigate('/admin')}
                  >
                    Admin
                  </button>
                )}
                <button
                  className="px-5 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition duration-300 ease-in-out shadow-md"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button
              className="px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-full hover:bg-yellow-600 transition duration-300 ease-in-out shadow-md"
              onClick={() => setShowLoginModal(true)}
            >
              Login / Register
            </button>
          )}
        </nav>

        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    </header>
  );
};

export default Header;