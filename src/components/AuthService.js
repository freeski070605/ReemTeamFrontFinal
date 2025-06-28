import axios from 'axios';
import { redirect } from 'react-router-dom';

const API_URL = 'https://reemteamserver.onrender.com'; // Replace with your backend URL

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Keep this if you still rely on cookies for some routes, otherwise remove
});

// Request interceptor to add the token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthService = {
  login: async (username, password) => {
    try {
      const response = await axiosInstance.post(
        `${API_URL}/users/login`,
        { username, password }
      );
      console.log('LOGIN RESPONSE', response.data);
      if (response.data.success && response.data.user) {
        // Token and userId are now stored in LoginPage.js after successful login
        // No need to store them here again.
        return {
          success: true,
          user: response.data.user,
          token: response.data.token // Pass token back to LoginPage to store
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
      await axiosInstance.post(`${API_URL}/users/logout`);
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

      const response = await axiosInstance.post(`${API_URL}/users/register`, { username, email, password });
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
    const response = await axiosInstance.get( `${API_URL}/users/profile` );
    console.log('AuthService.getCurrentUser response:', response.data); // More specific log
    if (response.data && response.data.success) {
      return { success: true, user: response.data.user };
    }
    // If response.data exists but success is false, or user is missing
    console.warn('AuthService.getCurrentUser: User data not found or success is false.', response.data); // Log more details
    return { success: false, error: response.data?.message || 'User data not found' };
  } catch (error) {
    console.error('AuthService.getCurrentUser error:', error.response?.data || error.message || error); // Log full error
    // Return success: false on any error during the API call
    return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch current user' };
  }
},



  leaveTable: async (tableId, username) => {
    try {
      const response = await axiosInstance.post(
        `${API_URL}/tables/${tableId}/leave`, // ✅ fix the URL to match route
        { username }
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

// Clear all authentication data
export const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Clear any cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true;
  }
};


export default AuthService;
