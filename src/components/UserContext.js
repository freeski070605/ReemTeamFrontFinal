import React, { createContext, useState, useEffect } from 'react';
import AuthService from './AuthService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await AuthService.getCurrentUser();
                if (response && response.user) {
                    setUser(response.user);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const loadUserFromStorage = async () => {
          const token = localStorage.getItem('token');
    
          if (token) {
            try {
              // Attempt to get the current user using the stored token
              const response = await AuthService.getCurrentUser();
              if (response && response.success && response.user) {
                setUser(response.user); // Set user state if successful
              } else {
                // If token is invalid or expired, clear storage and user state
                console.warn('Token invalid or expired, clearing user data.');
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setUser(null);
              }
            } catch (error) {
              console.error('Error loading user from storage:', error);
              // Clear storage and user state on any error during re-authentication
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              setUser(null);
            }
          }
          setLoading(false); // Set loading to false once the check is complete
        };
    
        loadUserFromStorage();
      }, []); // Empty dependency array ensures this runs only once on component mount
    

    const updateUserChips = (newChips) => {
        setUser((prevUser) => ({
            ...prevUser,
            chips: newChips
        }));
    };

    // You can render a loading indicator while the user data is being fetched
  if (loading) {
    return <div>Loading application...</div>;
  }

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, updateUserChips }}>
            {children}
        </UserContext.Provider>
    );
};
