// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { validateSession } from '../services/AuthService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on component mount
    const storedUser = localStorage.getItem('anon_user');
    const storedToken = localStorage.getItem('session_token');
    const sessionExpiry = localStorage.getItem('session_expiry');
    
    if (storedUser && storedToken && sessionExpiry) {
      // Check if session is expired
      const now = new Date();
      const expiryDate = new Date(sessionExpiry);
      
      if (expiryDate > now) {
        // Session still valid, restore user data
        setUser(JSON.parse(storedUser));
        setSessionToken(storedToken);
      } else {
        // Session expired, clear data
        clearSessionData();
      }
    }
    
    setLoading(false);
  }, []);

  // Clear all session data
  const clearSessionData = () => {
    localStorage.removeItem('anon_user');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expiry');
    setUser(null);
    setSessionToken(null);
  };

  // Login function (for anonymous authentication)
  const login = (userData, token) => {
    setUser(userData);
    setSessionToken(token);
    
    // Calculate expiry (24 hours from now)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    
    // Store in localStorage
    localStorage.setItem('anon_user', JSON.stringify(userData));
    localStorage.setItem('session_token', token);
    localStorage.setItem('session_expiry', expiryDate.toISOString());
  };

  // Logout function
  const logout = () => {
    clearSessionData();
  };

  // Validate the current session
  const validateCurrentSession = async () => {
    if (!sessionToken) return false;
    
    try {
      const result = await validateSession(sessionToken);
      return result.valid;
    } catch (error) {
      console.error('Session validation failed:', error);
      clearSessionData();
      return false;
    }
  };

  // Update username (only available for anonymous users)
  const updateUsername = (newUsername) => {
    if (!user) return;
    
    const updatedUser = { ...user, displayName: newUsername };
    setUser(updatedUser);
    localStorage.setItem('anon_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        sessionToken,
        loading, 
        login, 
        logout,
        validateCurrentSession,
        updateUsername,
        isAnonymous: true // Always true in this version
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};