import React, { useState, useContext, useEffect } from 'react';
import Modal from 'react-modal';
import AuthService from './AuthService';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';

// Remove any duplicate Modal.setAppElement calls
const LoginPage = ({ handleLogin, onClose }) => {
  const { setUser } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        setUser(response.user);
        handleLogin(username, password);
        closeModal();
        navigate('/userprofile');
      } else {
        setErrorMessage(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage('Failed to authenticate. Please try again.');
    }
  };
  



  return (
    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} shouldCloseOnOverlayClick={true}  appElement={document.getElementById('root')}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {isRegistering && (
          <input
            type="email"
            placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </Modal>
  );
};

export default LoginPage;
