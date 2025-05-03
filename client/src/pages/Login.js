// client/src/pages/Login.js
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLoginUrl } from '../services/AuthService';
import SpotifyLogo from '../assets/spotify-logo.png';

const Login = () => {
  const location = useLocation();
  
  // Get the redirect path from location state (if it exists)
  const redirectPath = location.state?.from || '/';
  
  // Store the redirect path in localStorage so we can access it after OAuth redirect
  useEffect(() => {
    if (redirectPath && redirectPath !== '/') {
      localStorage.setItem('redirectAfterAuth', redirectPath);
    }
  }, [redirectPath]);
  
  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6">Heart Songs</h1>
        <p className="text-gray-300 mb-8">
          A fun multiplayer game where you pick songs to match different questions
          and vote for your favorites!
        </p>
        {redirectPath && redirectPath.startsWith('/join/') && (
          <div className="mb-4 p-3 bg-blue-900 rounded-lg">
            <p className="text-blue-200 text-sm">
              You'll be joined to the game after logging in
            </p>
          </div>
        )}
        <button 
          onClick={handleLogin}
          className="flex items-center justify-center w-full py-3 px-4 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors"
        >
          <img 
            src={SpotifyLogo} 
            alt="Spotify" 
            className="w-6 h-6 mr-2" 
          />
          Login with Spotify
        </button>
        <p className="text-gray-400 mt-4 text-sm">
          You'll need a Spotify account to play.
        </p>
      </div>
    </div>
  );
};

export default Login;