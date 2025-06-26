import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import LoginPage from './LoginPage';

import './Header.css';
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
  <header className="header">
    <div className="header-content">
      <div className="logo-section" onClick={() => navigate('/')}>
        <span className="logo-text">REEM</span>
        <span className="logo-accent">TEAM</span>
      </div>
      <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={`nav-section ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {user ? (
          <>
            <div className="user-section">
              <div className="chip-balance">
                <CasinoChip />
                <span>{user.chips}</span>
              </div>
              <span className="username">{user.username}</span>
            </div>
            
            <div className="nav-buttons">
              <button className="nav-button" onClick={() => navigate('/lobby')}>
                Play Now
              </button>
              <button className="nav-button" onClick={() => navigate('/userprofile')}>
                Profile
              </button>
              <button className="nav-button" onClick={() => navigate('/rules')}>
                Rules
              </button>
              {user.isAdmin && (
                <button className="nav-button admin" onClick={() => navigate('/admin')}>
                  Admin
                </button>
              )}
              <button className="nav-button logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <button className="nav-button login" onClick={() => setShowLoginModal(true)}>
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