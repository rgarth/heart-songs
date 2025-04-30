// client/src/pages/Callback.js
import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { handleCallback } from '../services/AuthService';

const Callback = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          setError('No authorization code provided');
          return;
        }
        
        // Exchange code for tokens
        const data = await handleCallback(code);
        
        // Save auth data to context
        login(data.user, data.accessToken, data.refreshToken);
        
        // Redirect to home
        navigate('/');
      } catch (error) {
        console.error('Error processing callback:', error);
        setError('Authentication failed. Please try again.');
      }
    };
    
    processCallback();
  }, [login, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h2>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Logging In</h2>
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-300 mt-4">Authenticating with Spotify...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;