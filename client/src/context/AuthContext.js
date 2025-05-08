// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { validateSession } from '../services/AuthService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth data from localStorage on mount and validate with server
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Check for stored auth data
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        
        if (storedUser && storedAccessToken) {
          // Validate session with server first
          const validationResult = await validateSession(storedAccessToken);
          
          if (validationResult.valid) {
            // Session is valid, use the user data returned from server
            // This ensures we have the most up-to-date user data
            setUser(validationResult.user || JSON.parse(storedUser));
            setAccessToken(storedAccessToken);
          } else {
            // Session is invalid (user might have been deleted on server)
            console.log('Session invalid or expired, logging out');
            logout();
          }
        }
      } catch (error) {
        console.error('Error loading/validating auth data:', error);
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