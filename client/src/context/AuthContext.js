// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { validateSession } from '../services/AuthService';

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
          
          // Validate the session with the server
          const validation = await validateSession(storedAccessToken);
          
          if (validation.valid && validation.user) {
            // Session is valid, update with fresh user data
            setUser(validation.user);
            setAccessToken(storedAccessToken);
            
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(validation.user));
          } else {
            // Session is invalid or expired
            console.error('Session validation failed:', validation);
            
            // Clear stored data
            logout();
          }
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

  // Function to manually validate session (can be called from other components)
  const validateUserSession = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    
    if (!token) {
      logout();
      return false;
    }
    
    try {
      const validation = await validateSession(token);
      
      if (validation.valid && validation.user) {
        // Update user data with latest from server
        setUser(validation.user);
        localStorage.setItem('user', JSON.stringify(validation.user));
        return true;
      } else {
        // Session is invalid
        logout();
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken,
        loading, 
        login, 
        logout,
        validateUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};