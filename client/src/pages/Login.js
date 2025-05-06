// client/src/pages/Login.js
import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { registerAnonymous, checkUsernameAvailability } from '../services/AuthService';
import { generateUsername, isValidUsername } from '../utils/usernameGenerator';

const Login = () => {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [customUsername, setCustomUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedUsername, setGeneratedUsername] = useState('');
  
  // Get the redirect path from location state (if it exists)
  const redirectPath = location.state?.from || '/';
  
  // Generate a username on component mount
  useEffect(() => {
    setGeneratedUsername(generateUsername());
  }, []);
  
  // Handle regenerating username
  const handleRegenerateUsername = () => {
    setGeneratedUsername(generateUsername());
  };
  
  // Toggle between custom and generated username
  const toggleCustomUsername = () => {
    if (customUsername) {
      // Switching to generated, reset any errors
      setError(null);
    }
    setCustomUsername(!customUsername);
  };
  
  // Handle username change
  const handleUsernameChange = (e) => {
    setUsername(e.target.value.toLowerCase());
    // Clear any errors when user is typing
    if (error) setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Determine which username to use
      const chosenUsername = customUsername ? username : generatedUsername;
      
      // Validate custom username if needed
      if (customUsername) {
        if (!chosenUsername.trim()) {
          setError('Please enter a username');
          setLoading(false);
          return;
        }
        
        if (!isValidUsername(chosenUsername)) {
          setError('Username must be in format: word_word_1234');
          setLoading(false);
          return;
        }
        
        // Check if username is available
        const isAvailable = await checkUsernameAvailability(chosenUsername);
        if (!isAvailable) {
          setError('Username is already taken');
          setLoading(false);
          return;
        }
      }
      
      // Register with server
      const data = await registerAnonymous(chosenUsername);
      
      if (!data || !data.sessionToken) {
        throw new Error('No session token received from server');
      }
      
      // Login with the returned data
      login(data.user, data.sessionToken);
      
      // Navigate based on redirect path
      if (redirectPath && redirectPath.startsWith('/join/')) {
        // If joining a specific game
        navigate(redirectPath);
      } else {
        // Default to home
        navigate('/');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6">Heart Songs</h1>
        <p className="text-gray-300 mb-8">
          Pick songs that match questions and vote for your favorites!
        </p>
        
        {redirectPath && redirectPath.startsWith('/join/') && (
          <div className="mb-6 p-3 bg-blue-900 rounded-lg">
            <p className="text-blue-200 text-sm">
              You'll be joined to the game after creating your username
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300 text-sm font-medium">Choose a Game Handle:</span>
              <button 
                type="button"
                onClick={toggleCustomUsername}
                className="text-blue-400 text-sm hover:underline"
              >
                {customUsername ? 'Use generated handle' : 'Create custom handle'}
              </button>
            </div>
            
            {customUsername ? (
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="e.g. rock_star_1234"
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <p className="text-gray-400 text-xs text-left">
                  Format: word_word_1234 (all lowercase)
                </p>
              </div>
            ) : (
              <div className="flex items-center mb-2">
                <span className="bg-gray-700 text-white px-3 py-2 rounded-lg flex-1 text-center font-medium">
                  {generatedUsername}
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateUsername}
                  className="ml-2 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                  title="Generate new handle"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Continue to Game'}
          </button>
        </form>
        
        <p className="text-gray-400 mt-6 text-sm">
          Your handle will only last for the duration of your session.
        </p>
      </div>
    </div>
  );
};

export default Login;