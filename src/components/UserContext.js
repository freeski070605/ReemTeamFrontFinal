import React, { createContext, useState, useEffect } from 'react';
import AuthService from './AuthService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const updateUserChips = (newChips) => {
        setUser((prevUser) => ({
            ...prevUser,
            chips: newChips
        }));
    };

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, updateUserChips }}>
            {children}
        </UserContext.Provider>
    );
};
