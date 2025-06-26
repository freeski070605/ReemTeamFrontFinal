import axios from 'axios';
import { redirect } from 'react-router-dom';

const API_URL = 'https://reemteamserver.onrender.com'; // Replace with your backend URL

const AuthService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/users/login`,
        { username, password },
        { withCredentials: true }
      );
      if (response.data.success && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id);
        return {
          success: true,
          user: response.data.user
        };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Failed to login. Please try again.');
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/users/logout`, {}, { withCredentials: true });
      console.log('Logout successful');
      redirect('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  },

  register: async (username, email, password) => {
    try {
      console.log('Registration request:', { username, email, password });

      const response = await axios.post(`${API_URL}/users/register`, { username, email, password });
      console.log('Registration response:', response.data);

      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Failed to register. Please try again.');
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
      console.log('Get current user response:', response.data);
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  leaveTable: async (tableId, username) => {
    try {
      const response = await axios.post(
        `${API_URL}/tables/${tableId}/leave`, // ✅ fix the URL to match route
        { username },
        { withCredentials: true }
      );
      console.log('Leave table response:', response.data);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Leave table error:', error);
      throw new Error('Failed to leave table. Please try again.');
    }
  }
};  

export default AuthService;
