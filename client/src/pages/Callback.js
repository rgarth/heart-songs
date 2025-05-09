// client/src/pages/Callback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * This component is a placeholder since we no longer use Spotify authentication.
 * It redirects users to the home page and can be used if you decide to add 
 * another authentication provider in the future.
 */
const Callback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
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
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Redirecting...</h2>
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-300 mt-4">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default Callback;