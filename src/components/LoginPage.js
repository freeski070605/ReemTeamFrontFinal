import React, { useState, useContext, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import AuthService from './AuthService';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';

const LoginPage = ({ handleLogin, onClose }) => {
  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Delay modal opening slightly to ensure proper initialization
    const timer = setTimeout(() => {
      setModalIsOpen(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setModalIsOpen(false);
    };
  }, []);

  const closeModal = () => {
    setModalIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      let response;
      if (isRegistering) {
        response = await AuthService.register(username, email, password);
        if (response.success) {
          // After successful registration, log in automatically
          response = await AuthService.login(username, password);
        }
      } else {
        response = await AuthService.login(username, password);
      }
  
      if (response.success && response.user) {
        // Ensure token and userId are always stored after successful authentication
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user && response.user._id) {
          localStorage.setItem('userId', response.user._id);
        }
        setUser(response.user);
        handleLogin(username, password);
        closeModal();
        navigate('/userprofile'); // Navigate after state is set and local storage is updated

        // Dispatch custom event after successful login and token/userId storage
        window.dispatchEvent(new Event('loginSuccess'));
      } else {
        setErrorMessage(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage('Failed to authenticate. Please try again.');
    }
  };
  
  
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick={true}
      appElement={document.getElementById('root')}
      className="flex items-center justify-center p-4"
      overlayClassName="fixed inset-0 bg-darkBackground bg-opacity-75 flex items-center justify-center z-overlay"
    >
      <div className="bg-darkBackground p-md rounded-md shadow-lg max-w-md w-full border border-borderColor">
        <h2 className="text-lightText text-xl font-bold mb-lg text-center">
          {isRegistering ? 'Register' : 'Login'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-md">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-sm rounded-sm bg-gray-700 text-lightText placeholder-gray-400 border border-borderColor focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-sm rounded-sm bg-gray-700 text-lightText placeholder-gray-400 border border-borderColor focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-sm rounded-sm bg-gray-700 text-lightText placeholder-gray-400 border border-borderColor focus:outline-none focus:ring-2 focus:ring-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-lightText"
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-lightText p-sm rounded-sm font-semibold hover:bg-buttonHover transition-colors duration-200"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full bg-gray-600 text-lightText p-sm rounded-sm font-semibold hover:bg-gray-700 transition-colors duration-200 mt-sm"
          >
            {isRegistering ? 'Switch to Login' : 'Switch to Register'}
          </button>
          {errorMessage && (
            <p className="text-error text-sm text-center mt-md">{errorMessage}</p>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default LoginPage;
