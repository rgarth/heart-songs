// client/src/pages/Login.js - Updated with Terms Checkbox
import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { registerAnonymous, checkUsernameAvailability } from '../services/AuthService';
import { generateUsername, isValidUsername } from '../utils/usernameGenerator';
import TermsCheckbox from '../components/TermsCheckbox';
import VinylRecord from '../components/VinylRecord';

const Login = () => {
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [customUsername, setCustomUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(localStorage.getItem('termsAccepted') === 'true');
  
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
  
  // Handle terms checkbox change
  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
    if (e.target.checked) {
      localStorage.setItem('termsAccepted', 'true');
    } else {
      localStorage.removeItem('termsAccepted');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if terms are accepted
    if (!termsAccepted) {
      setError('You must accept the Terms of Service to continue');
      return;
    }
    
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Main card */}
        <div className="bg-gray-800 rounded-lg shadow-2xl border border-purple-500/30 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8 text-center border-b border-purple-500/30">
            {/* Spinning vinyl logo */}
            <div className="relative inline-block mb-4">
               <VinylRecord 
                  className="w-24 h-24 relative z-10"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
            </div>
            
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 mb-2">
              HEART SONGS
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Where Music Meets Personality
            </p>
          </div>
          
          {/* Join notification */}
          {redirectPath && redirectPath.startsWith('/join/') && (
            <div className="mx-6 -mt-4 relative z-10">
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center text-yellow-400 text-sm font-medium">
                  Ready to join the game!
                </div>
              </div>
            </div>
          )}
          
          <div className="p-8">
            {/* Username selection */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username section */}
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-gray-300 text-sm font-medium flex items-center">
                    🏷️ Your Display Name
                  </label>
                  <button 
                    type="button"
                    onClick={toggleCustomUsername}
                    className="text-xs font-medium text-pink-400 hover:text-purple-400 transition-colors"
                  >
                    {customUsername ? '✨ Use Generated' : '✏️ Customize'}
                  </button>
                </div>
                
                {customUsername ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="e.g. rock_star_1234"
                      className="w-full p-3 bg-gray-900 text-white rounded-lg border border-purple-500/30 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-mono"
                    />
                    <p className="text-xs text-gray-400">
                      Format: word_word_1234 (lowercase)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-yellow-500/40 text-center">
                      <span className="text-yellow-400 font-bold text-lg font-mono">
                        {generatedUsername}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegenerateUsername}
                      className="ml-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all group"
                      title="Generate new username"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Terms of Service Checkbox */}
              <TermsCheckbox 
                checked={termsAccepted} 
                onChange={handleTermsChange} 
              />
              
              {/* Error display */}
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/40 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center text-red-400">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {/* Submit button */}
              <button 
                type="submit"
                disabled={loading || !termsAccepted}
                className={`w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium transition-all transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/40 ${
                  loading || !termsAccepted ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Ready...
                  </div>
                ) : (
                  "Start Playing"
                )}
              </button>
            </form>
            
            {/* Temporary account notice */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center bg-blue-500/10 rounded-full px-4 py-2 border border-blue-500/30">
                <svg className="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-400 text-xs font-medium">
                  Temporary session • No signup required
                </span>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 text-center border-t border-purple-500/20">
            <div className="flex justify-center items-center space-x-4 text-gray-400">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;