import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import LoginPage from './LoginPage';
import { Menu, X, Wifi, WifiOff } from 'lucide-react'; // Import icons

import { UserContext } from './UserContext';
import { SocketContext } from './SocketContext'; // Import SocketContext
import ChipSystem from '../utils/ChipSystem';
import CasinoChip from '../utils/casinoChip';


const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const { isConnected } = useContext(SocketContext); // Use isConnected from SocketContext
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const [chipBalance, setChipBalance] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false); // State for dropdown


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
    <header className="bg-darkBackground shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-3xl font-extrabold text-accentGold tracking-wide">REEM</span>
          <span className="text-3xl font-extrabold text-lightText tracking-wide">TEAM</span>
        </div>

        {/* Desktop Navigation & Status */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              {/* User Info & Chips */}
              <div className="flex items-center space-x-4 bg-gray-700 rounded-full px-4 py-2">
                <div className="flex items-center space-x-2 text-accentGold font-semibold text-lg">
                  <CasinoChip />
                  <span>{user.chips}</span>
                </div>
                <span className="text-lightText font-medium text-lg">{user.username}</span>
              </div>

              {/* Connection Status & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition duration-300 ease-in-out shadow-md
                                ${isConnected ? 'bg-success text-lightText hover:bg-green-700' : 'bg-accentRed text-lightText hover:bg-red-700'}`}
                >
                  {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </button>
                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-lightText hover:bg-gray-700"
                    >
                      Leave Table
                    </button>
                  </div>
                )}
              </div>

              {/* Main Navigation Buttons */}
              <div className="flex space-x-4">
                <button
                  className="px-5 py-2 bg-primary text-lightText font-semibold rounded-full hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/lobby')}
                >
                  Play Now
                </button>
                <button
                  className="px-5 py-2 bg-gray-600 text-lightText font-semibold rounded-full hover:bg-gray-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/userprofile')}
                >
                  Profile
                </button>
                <button
                  className="px-5 py-2 bg-success text-lightText font-semibold rounded-full hover:bg-green-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => navigate('/rules')}
                >
                  Rules
                </button>
                {user.isAdmin && (
                  <button
                    className="px-5 py-2 bg-purple-600 text-lightText font-semibold rounded-full hover:bg-purple-700 transition duration-300 ease-in-out shadow-md"
                    onClick={() => navigate('/admin')}
                  >
                    Admin
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              className="px-6 py-2 bg-accentGold text-darkText font-bold rounded-full hover:bg-yellow-600 transition duration-300 ease-in-out shadow-md"
              onClick={() => setShowLoginModal(true)}
            >
              Login / Register
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-accentGold focus:outline-none focus:ring-2 focus:ring-accentGold rounded-md"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden absolute top-full left-0 right-0 bg-darkBackground p-4 shadow-md flex flex-col space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-accentGold font-semibold text-lg">
                  <CasinoChip />
                  <span>{user.chips}</span>
                  <span className="text-lightText font-medium text-lg ml-2">{user.username}</span>
                </div>
                <button
                  className="px-5 py-2 bg-primary text-lightText font-semibold rounded-full hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => { navigate('/lobby'); setIsMobileMenuOpen(false); }}
                >
                  Play Now
                </button>
                <button
                  className="px-5 py-2 bg-gray-600 text-lightText font-semibold rounded-full hover:bg-gray-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => { navigate('/userprofile'); setIsMobileMenuOpen(false); }}
                >
                  Profile
                </button>
                <button
                  className="px-5 py-2 bg-success text-lightText font-semibold rounded-full hover:bg-green-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => { navigate('/rules'); setIsMobileMenuOpen(false); }}
                >
                  Rules
                </button>
                {user.isAdmin && (
                  <button
                    className="px-5 py-2 bg-purple-600 text-lightText font-semibold rounded-full hover:bg-purple-700 transition duration-300 ease-in-out shadow-md"
                    onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  >
                    Admin
                  </button>
                )}
                <button
                  className="px-5 py-2 bg-accentRed text-lightText font-semibold rounded-full hover:bg-red-700 transition duration-300 ease-in-out shadow-md"
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                >
                  Logout
                </button>
                <div className={`flex items-center gap-2 text-sm font-semibold mt-4
                                ${isConnected ? 'text-success' : 'text-accentRed'}`}>
                  {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </>
            ) : (
              <button
                className="px-6 py-2 bg-accentGold text-darkText font-bold rounded-full hover:bg-yellow-600 transition duration-300 ease-in-out shadow-md"
                onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
              >
                Login / Register
              </button>
            )}
          </nav>
        )}

        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    </header>
  );
};

export default Header;