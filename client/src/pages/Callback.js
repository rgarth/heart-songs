// client/src/pages/Callback.js
import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { handleCallback } from '../services/AuthService';

const Callback = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processingState, setProcessingState] = useState('Authenticating with Spotify...');
  
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
        
        setProcessingState('Verifying your account...');
        
        // Exchange code for tokens
        const data = await handleCallback(code);
        
        // Save auth data to context
        login(data.user, data.accessToken, data.refreshToken);
        
        setProcessingState('Login successful! Redirecting...');
        
        // Check if there's a stored redirect path (for join game links)
        const redirectPath = localStorage.getItem('redirectAfterAuth');
        
        if (redirectPath) {
          // Clear the stored path
          localStorage.removeItem('redirectAfterAuth');
          
          // Redirect to the stored path
          navigate(redirectPath, { replace: true });
        } else {
          // Default redirect to home
          navigate('/', { replace: true });
        }
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
        {(
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Logging In</h2>
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-300 mt-4">{processingState}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;