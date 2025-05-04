// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
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
        
        console.log('Initial auth state from localStorage:', {
          hasUser: !!storedUser,
          hasToken: !!storedAccessToken
        });
        
        if (storedUser && storedAccessToken) {
          // Parse user data
          const userData = JSON.parse(storedUser);
          
          // Set state
          setUser(userData);
          setAccessToken(storedAccessToken);
          
          console.log('Found stored token:', storedAccessToken);
          console.log('Restored session from localStorage:', {
            user: userData.displayName || userData.id,
            tokenLength: storedAccessToken.length
          });
        } else {
          console.log('No valid auth data found in localStorage');
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

  // Log changes to auth context for debugging
  useEffect(() => {
    console.log('AuthContext updated:', {
      hasUser: !!user,
      displayName: user?.displayName || user?.username,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length
    });
  }, [user, accessToken]);

  // Login function
  const login = (userData, token) => {
    console.log('Login called with:', {
      userData: userData?.displayName || userData?.username || userData?.id,
      tokenLength: token?.length
    });
    
    setUser(userData);
    setAccessToken(token);
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
  };

  // Logout function
  const logout = () => {
    console.log('Logging out, clearing auth state');
    
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