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
    
    console.log('Initial auth state from localStorage:', { 
      hasUser: !!storedUser, 
      hasToken: !!storedToken, 
      hasExpiry: !!sessionExpiry 
    });
    
    if (storedToken) {
      console.log('Found stored token:', storedToken);
    }
    
    if (storedUser && storedToken && sessionExpiry) {
      // Check if session is expired
      const now = new Date();
      const expiryDate = new Date(sessionExpiry);
      
      if (expiryDate > now) {
        // Session still valid, restore user data
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSessionToken(storedToken);
        console.log('Restored session from localStorage:', { 
          user: parsedUser.displayName,
          tokenLength: storedToken.length
        });
      } else {
        // Session expired, clear data
        console.log('Session expired, clearing data');
        clearSessionData();
      }
    }
    
    setLoading(false);
  }, []);

  // Clear all session data
  const clearSessionData = () => {
    console.log('Clearing session data');
    localStorage.removeItem('anon_user');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expiry');
    setUser(null);
    setSessionToken(null);
  };

  // Login function (for anonymous authentication)
  const login = (userData, token) => {
    console.log('Login with:', { 
      userData: userData ? { 
        id: userData.id, 
        displayName: userData.displayName 
      } : null, 
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    
    if (!userData || !token) {
      console.error('Cannot login - missing user data or token');
      return;
    }
    
    setUser(userData);
    setSessionToken(token);
    
    // Calculate expiry (24 hours from now)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    
    // Store in localStorage
    localStorage.setItem('anon_user', JSON.stringify(userData));
    localStorage.setItem('session_token', token);
    localStorage.setItem('session_expiry', expiryDate.toISOString());
    
    console.log('Auth data saved to localStorage');
    
    // Verify the data was saved correctly
    const storedToken = localStorage.getItem('session_token');
    console.log('Verified token in localStorage:', storedToken);
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, clearing session data');
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

  // For debugging - log when context values change
  useEffect(() => {
    console.log('AuthContext updated:', { 
      hasUser: !!user, 
      displayName: user?.displayName,
      hasToken: !!sessionToken,
      tokenLength: sessionToken?.length
    });
  }, [user, sessionToken]);

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