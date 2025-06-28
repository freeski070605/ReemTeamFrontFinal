import React, { createContext, useState, useEffect } from 'react';
import AuthService from './AuthService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Use a single loading state

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await AuthService.getCurrentUser();
                    if (response && response.success && response.user) {
                        setUser(response.user);
                    } else {
                        console.warn('Token invalid or expired, clearing user data.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error loading user from storage:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    setUser(null);
                }
            }
            setIsLoading(false); // Set loading to false once the check is complete
        };

        loadUser();
    }, []); // Empty dependency array ensures this runs only once on component mount

    const updateUserChips = (newChips) => {
        setUser((prevUser) => ({
            ...prevUser,
            chips: newChips
        }));
    };

    if (isLoading) { // Use the single isLoading state
        return <div>Loading application...</div>;
    }

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, updateUserChips }}>
            {children}
        </UserContext.Provider>
    );
};
