// client/src/components/Header.js - Fixed non-clickable logo and hover effect
import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { leaveGame } from '../services/gameService';
import VinylRecord from './VinylRecord';

const Header = ({ gameCode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Check if we're on a game page
  const isOnGamePage = location.pathname.startsWith('/game/');
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleGoHome = async () => {
    // If on a game page and there's a game code, try to leave the game properly
    if (isOnGamePage && gameCode) {
      try {
        // Extract game ID from the current path
        const gameId = location.pathname.split('/game/')[1];
        
        // Get token
        const token = localStorage.getItem('accessToken');
        
        if (gameId && token) {
          // Try to leave the game
          await leaveGame(gameId, token);
        }
      } catch (error) {
        console.error('Error leaving game from header:', error);
        // Continue to navigate even if leaving fails
      }
    }
    
    // Navigate to home
    navigate('/');
  };

  // Copy game code to clipboard
  const copyGameCode = () => {
    if (!gameCode) return;
    
    try {
      navigator.clipboard.writeText(gameCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };
  
  return (
    <>
      {/* Main header - Stage lighting effect */}
      <header className="bg-gradient-to-r from-deep-space via-stage-dark to-midnight-purple shadow-lg shadow-electric-purple/20 border-b border-electric-purple/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo - Spinning vinyl record with neon glow - REMOVED CLICKABLE BEHAVIOR */}
            <div className="flex items-center">
              <div className="relative mr-6 group"> {/* Group for hover effects */}
                {/* Glow effect behind the vinyl */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 blur-lg scale-125 group-hover:scale-150 transition-all duration-300"></div>
                
                {/* Animated glow ring - FIXED HOVER EFFECT */}
                <div className="absolute inset-0 rounded-full border-2 border-neon-pink/30 group-hover:border-electric-purple/50 transition-all"></div>
                
                <VinylRecord 
                  className="w-12 h-12 relative z-10"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
              </div>
              <h1 className="text-3xl font-rock neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
                HEART SONGS
              </h1>
            </div>
            
            {/* Menu toggle - Sideways EQ (3 horizontal lines) */}
            <button 
              className="text-white focus:outline-none ml-auto mr-4 p-3 rounded-lg bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 hover:from-electric-purple/40 hover:to-neon-pink/40 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="equalizer-sideways">
                <div className="equalizer-bar-sideways"></div>
                <div className="equalizer-bar-sideways"></div>
                <div className="equalizer-bar-sideways"></div>
              </div>
            </button>
            
            {/* Desktop user info - Concert VIP style */}
            {user && (
              <div className="hidden md:flex items-center bg-stage-dark/50 rounded-full px-4 py-2 border border-electric-purple/30">
                {user.profileImage && (
                  <div className="relative">
                    <img 
                      src={user.profileImage} 
                      alt={user.displayName || user.username} 
                      className="w-10 h-10 rounded-full mr-3 border-2 border-gold-record" 
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-green rounded-full border-2 border-stage-dark animate-pulse"></div>
                  </div>
                )}
                <div className="mr-4">
                  <p className="font-medium text-white font-concert">{user.displayName || user.username}</p>
                  <div className="flex items-center text-xs">
                    <span className="text-silver">Score:</span>
                    <span className="ml-2 text-gold-record font-bold">{user.score || 0}</span>
                  </div>
                </div>
                
                {/* Go Home Button */}
                <button 
                  onClick={handleGoHome}
                  className="btn-electric py-2 px-4 mr-2 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    HOME
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                {/* Themed logout button */}
                <button 
                  onClick={handleLogout}
                  className="btn-stage py-2 px-4 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    LOGOUT
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Dropdown menu */}
      {menuOpen && user && (
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black py-4 px-4 shadow-inner shadow-electric-purple/20 border-b border-electric-purple/20">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              
              {/* Mobile user info - Backstage pass style */}
              <div className="md:hidden bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-4 border border-electric-purple/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {user.profileImage && (
                      <div className="relative">
                        <img 
                          src={user.profileImage} 
                          alt={user.displayName || user.username} 
                          className="w-12 h-12 rounded-full mr-3 border-2 border-gold-record" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-lime-green rounded-full border-2 border-stage-dark flex items-center justify-center">
                          <span className="text-xs">♪</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white font-concert text-lg">{user.displayName || user.username}</p>
                      <div className="flex items-center">
                        <span className="text-silver text-sm">SCORE:</span>
                        <span className="ml-2 text-gold-record font-bold text-lg">{user.score || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleGoHome}
                      className="btn-electric py-2 px-4 text-sm group relative overflow-hidden"
                      title="Go to home page"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        HOME
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="btn-stage py-2 px-4 text-sm group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        LOGOUT
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Game code - Concert ticket style */}
              {gameCode && (
                <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="text-silver text-sm font-medium mb-1">GAME CODE</div>
                      <div className="flex items-center">
                        <span className="text-3xl font-rock neon-gold tracking-widest font-mono">
                          {gameCode}
                        </span>
                        <button
                          onClick={copyGameCode}
                          className="ml-3 p-3 bg-gradient-to-r from-electric-purple to-neon-pink rounded-full hover:shadow-neon-purple transition-all group"
                          aria-label="Copy game code"
                          title="Copy game code to share"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                      </div>
                      {copySuccess && (
                        <div className="mt-2 flex items-center text-lime-green text-sm animate-pulse">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          CODE COPIED!
                        </div>
                      )}
                    </div>
                    
                    {/* Stage lighting decoration */}
                    <div className="flex-1 flex justify-end">
                      <div className="w-2 h-16 bg-gradient-to-t from-electric-purple via-neon-pink to-turquoise rounded-full opacity-30 animate-pulse"></div>
                      <div className="w-2 h-12 bg-gradient-to-t from-neon-pink via-turquoise to-lime-green rounded-full opacity-40 animate-pulse ml-1" style={{animationDelay: '0.5s'}}></div>
                      <div className="w-2 h-14 bg-gradient-to-t from-turquoise via-lime-green to-gold-record rounded-full opacity-30 animate-pulse ml-1" style={{animationDelay: '1s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;