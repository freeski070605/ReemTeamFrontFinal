import React, { useContext, useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import LoginPage from './LoginPage';
import { UserContext } from './UserContext';
import AuthService from './AuthService';
const HomePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-darkBackground text-lightText flex flex-col">
      <section className="relative flex-grow flex items-center justify-center text-center py-20">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526304640581-d334cdb7ae45?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')" }}></div>
        <div className="relative z-10 p-md max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
            <span className="block">Reem Team</span>
            <span className="block text-accentGold">Tonk</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Fast-paced, competitive Tonk with real money stakes. Join a table, showcase your skills, and win big.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-md mb-8">
            <Link to="/lobby" className="bg-primary text-lightText px-lg py-md rounded-md text-lg font-semibold hover:bg-buttonHover transition-colors duration-200 shadow-lg">
              Play Now
            </Link>
            <Link to="/rules" className="bg-gray-700 text-lightText px-lg py-md rounded-md text-lg font-semibold hover:bg-gray-600 transition-colors duration-200 shadow-lg">
              Learn Rules
            </Link>
          </div>

          {!user ? (
            <div className="mt-8">
              <button
                className="bg-secondary text-darkBackground px-lg py-md rounded-md text-lg font-semibold hover:bg-green-600 transition-colors duration-200 shadow-lg"
                onClick={() => setShowLoginModal(true)}
              >
                Log In / Register
              </button>
            </div>
          ) : (
            <div className="mt-8 p-md bg-gray-800 rounded-lg shadow-xl">
              <p className="text-xl mb-4">Welcome back, <span className="font-bold text-primary">{user.username}</span>! You have <span className="font-bold text-accentGold">{user.chips}</span> chips.</p>
              <button
                className="bg-accentRed text-lightText px-lg py-md rounded-md text-lg font-semibold hover:bg-red-700 transition-colors duration-200 shadow-lg"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center p-md">
        <p className="mb-2">© 2023 Reem Team. All rights reserved.</p>
        <div className="flex justify-center space-x-md">
          <a href="https://facebook.com/reemteam" target="_blank" rel="noopener noreferrer" className="hover:text-lightText transition-colors duration-200">Facebook</a>
          <a href="https://twitter.com/reemteam" target="_blank" rel="noopener noreferrer" className="hover:text-lightText transition-colors duration-200">Twitter</a>
          <a href="https://instagram.com/reemteam" target="_blank" rel="noopener noreferrer" className="hover:text-lightText transition-colors duration-200">Instagram</a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;