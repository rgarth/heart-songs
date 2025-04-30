// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { refreshAccessToken } from '../services/AuthService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on component mount
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (storedUser && storedAccessToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      
      // Check if token is expired or about to expire
      const now = new Date();
      const expiryDate = new Date(tokenExpiry);
      
      if (expiryDate <= now) {
        handleTokenRefresh(storedRefreshToken);
      }
    }
    
    setLoading(false);
  }, []);

  // Function to refresh token
  const handleTokenRefresh = async (token) => {
    try {
      const data = await refreshAccessToken(token);
      setAccessToken(data.accessToken);
      
      // Update localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('tokenExpiry', data.expiryDate);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  // Login function
  const login = (userData, token, refresh) => {
    setUser(userData);
    setAccessToken(token);
    setRefreshToken(refresh);
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('tokenExpiry', new Date(Date.now() + 3600 * 1000).toISOString());
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken, 
        refreshToken, 
        loading, 
        login, 
        logout,
        refreshToken: handleTokenRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
