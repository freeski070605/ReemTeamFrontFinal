import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoginPage from './LoginPage';
import { UserContext } from './UserContext';
import AuthService from './AuthService';

const HomePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const [feedbackMessage, setFeedbackMessage] = useState(''); // New feedback message state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState(''); // 'success' or 'error'
  const navigate = useNavigate();

 useEffect(() => {
   if (showToast) {
     const timer = setTimeout(() => {
       setShowToast(false);
       setToastMessage('');
       setToastType('');
     }, 3000); // Toast disappears after 3 seconds
     return () => clearTimeout(timer);
   }
 }, [showToast]);

  const handleLogin = async (username, password) => {
    setLoading(true); // Set loading to true
    setToastMessage(''); // Clear previous messages
    setShowToast(false); // Hide any existing toast
    try {
      const result = await AuthService.login(username, password);
      if (result.success) {
        setShowLoginModal(false);
        setToastMessage('Login successful!');
        setToastType('success');
        setShowToast(true);
        navigate('/userprofile');
      } else {
        setToastMessage(result.error || 'Login failed. Please check your credentials.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setToastMessage('An error occurred during login. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false); // Always set loading to false
    }
  };

  const handleLogout = async () => {
    setLoading(true); // Set loading to true
    setToastMessage(''); // Clear previous messages
    setShowToast(false); // Hide any existing toast
    try {
      await AuthService.logout();
      setUser(null); // Clear user data on logout
      setToastMessage('Logged out successfully!');
      setToastType('success');
      setShowToast(true);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setToastMessage('An error occurred during logout. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false); // Always set loading to false
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
                className="bg-secondary text-darkBackground px-lg py-md rounded-md text-lg font-semibold hover:bg-green-600 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowLoginModal(true)}
                disabled={loading} // Disable button when loading
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : 'Log In / Register'}
              </button>
            </div>
          ) : (
            <div className="mt-8 p-md bg-gray-800 rounded-lg shadow-xl">
              <p className="text-xl mb-4">Welcome back, <span className="font-bold text-primary">{user.username}</span>! You have <span className="font-bold text-accentGold">{user.chips}</span> chips.</p>
              <button
                className="bg-accentRed text-lightText px-lg py-md rounded-md text-lg font-semibold hover:bg-red-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLogout}
                disabled={loading} // Disable button when loading
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging Out...
                  </>
                ) : 'Log Out'}
              </button>
            </div>
          )}
        </div>
        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      {showToast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-lightText z-50
          ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toastMessage}
        </div>
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