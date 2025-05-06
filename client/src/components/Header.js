// client/src/components/Header.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = ({ gameCode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleGoHome = () => {
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
      {/* Main header - always visible */}
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4">
          {/* Single row - brand and logo */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center cursor-pointer" onClick={handleGoHome}>
              <img src="/logo192.png" alt="Heart Songs" className="h-10 w-auto mr-3" />
              <h1 className="text-2xl font-bold text-white">Heart Songs</h1>
            </div>
            
            {/* Menu toggle button - always show this regardless of screen size */}
            <button 
              className="text-white focus:outline-none ml-auto mr-4"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* User info and logout button */}
            {user && (
              <div className="hidden md:flex items-center">
                {user.profileImage && (
                  <img 
                    src={user.profileImage} 
                    alt={user.displayName || user.username} 
                    className="w-8 h-8 rounded-full mr-2" 
                  />
                )}
                <div className="mr-4">
                  <p className="font-medium text-white">{user.displayName || user.username}</p>
                  <p className="text-xs text-gray-400">Score: {user.score || 0}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Dropdown menu - only shown when menu is open */}
      {menuOpen && user && (
        <div className="bg-gray-750 py-3 px-4 shadow-inner">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* User info for mobile */}
              <div className="md:hidden flex items-center justify-between">
                <div className="flex items-center">
                  {user.profileImage && (
                    <img 
                      src={user.profileImage} 
                      alt={user.displayName || user.username} 
                      className="w-8 h-8 rounded-full mr-2" 
                    />
                  )}
                  <div>
                    <p className="font-medium text-white">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-400">Score: {user.score || 0}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="py-1 px-3 bg-red-600 text-white text-sm rounded hover:bg-red-700 md:hidden"
                >
                  Logout
                </button>
              </div>
              
              {/* Game code - always visible in dropdown regardless of screen size */}
              {gameCode && (
                <div className="border-t md:border-t-0 border-gray-700 pt-3 md:pt-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Game Code:</p>
                      <p className="text-xl font-bold tracking-wider text-yellow-400 font-mono">
                        {gameCode}
                      </p>
                    </div>
                    <button
                      onClick={copyGameCode}
                      className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 focus:outline-none"
                      aria-label="Copy game code"
                      title="Copy game code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                    {copySuccess && (
                      <p className="text-green-400 text-xs">
                        Copied!
                      </p>
                    )}
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