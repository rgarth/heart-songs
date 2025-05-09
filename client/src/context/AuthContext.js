// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Check for stored auth data
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        
        if (storedUser && storedAccessToken) {
          // Parse user data
          const userData = JSON.parse(storedUser);
          
          // Set state
          setUser(userData);
          setAccessToken(storedAccessToken);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        // Clear potentially corrupted data
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    loadAuthData();
  }, []);

  // Login function
  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken,
        loading, 
        login, 
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};