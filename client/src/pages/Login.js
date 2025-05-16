// client/src/pages/Login.js - Rockstar Design Edition
import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { registerAnonymous, checkUsernameAvailability } from '../services/AuthService';
import { generateUsername, isValidUsername } from '../utils/usernameGenerator';
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
    <div className="min-h-screen stage-bg flex items-center justify-center p-4">
      {/* Concert venue background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-electric-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-turquoise/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Main stage card */}
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          
          {/* Stage header with logo */}
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-8 text-center border-b border-electric-purple/30">
            {/* Spinning vinyl logo */}
            <div className="relative inline-block mb-4">
               <VinylRecord 
                  className="w-24 h-24 relative z-10"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
            </div>
            
            <h1 className="text-4xl font-rock neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-2">
              HEART SONGS
            </h1>
            <p className="text-silver text-sm font-medium">
              Where Music Meets Personality
            </p>
          </div>
          
          {/* Join notification */}
          {redirectPath && redirectPath.startsWith('/join/') && (
            <div className="mx-6 -mt-4 relative z-10">
              <div className="bg-gradient-to-r from-gold-record/20 to-yellow-400/20 border border-gold-record/40 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center text-gold-record text-sm font-medium">
                  <span className="mr-2">🎟️</span>
                  Ready to join the concert!
                </div>
              </div>
            </div>
          )}
          
          <div className="p-8">
            {/* Username selection - simplified UI */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username section with rock styling */}
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/20">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-silver text-sm font-medium flex items-center">
                    🏷️ Your Stage Name
                  </label>
                  <button 
                    type="button"
                    onClick={toggleCustomUsername}
                    className="text-xs font-medium text-neon-pink hover:text-electric-purple transition-colors"
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
                      className="w-full p-3 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all font-mono"
                    />
                    <p className="text-xs text-silver">
                      Format: word_word_1234 (lowercase)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="flex-1 bg-vinyl-black rounded-lg p-3 border border-gold-record/40 text-center">
                      <span className="text-gold-record font-bold text-lg font-mono">
                        {generatedUsername}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegenerateUsername}
                      className="ml-3 p-3 bg-gradient-to-r from-electric-purple to-neon-pink rounded-lg hover:shadow-neon-purple/50 hover:shadow-lg transition-all group"
                      title="Generate new username"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Error display */}
              {error && (
                <div className="bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center text-stage-red">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {/* Get on stage button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-electric relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="vinyl-record w-6 h-6 animate-spin mr-3"></div>
                      GETTING READY...
                    </>
                  ) : (
                    <>
                      GET ON STAGE
                    </>
                  )}
                </span>
                {/* Stage lights effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </form>
            
            {/* Temporary account notice */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center bg-turquoise/10 rounded-full px-4 py-2 border border-turquoise/30">
                <svg className="w-4 h-4 text-turquoise mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-turquoise text-xs font-medium">
                  Temporary session • No signup required
                </span>
              </div>
            </div>
          </div>
          
          {/* Stage footer with musical notes */}
          <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 p-4 text-center border-t border-electric-purple/20">
            <div className="flex justify-center items-center space-x-4 text-silver/50">
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Login;