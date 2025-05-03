// client/src/pages/JoinGame.js
import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { joinGame, getGameState } from '../services/gameService';

const JoinGame = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Create a flag in sessionStorage to prevent double joins
    const joinFlag = `already_joining_${gameCode}`;
    
    const handleJoin = async () => {
      if (!gameCode) {
        setError('No game code provided');
        setLoading(false);
        return;
      }
      
      // Check if we're already processing a join for this game code
      if (sessionStorage.getItem(joinFlag)) {
        console.log(`Already joining game ${gameCode}, preventing duplicate join`);
        
        try {
          // Just get the game state to navigate to the correct game page
          const game = await getGameState(gameCode, accessToken);
          navigate(`/game/${game._id}`);
        } catch (error) {
          console.error('Error getting game state:', error);
          setError('Failed to retrieve game details. Please try again.');
          setLoading(false);
        }
        
        return;
      }
      
      try {
        setLoading(true);
        // Set the flag to prevent duplicate joins
        sessionStorage.setItem(joinFlag, 'true');
        
        const game = await joinGame(gameCode, user.id, accessToken);
        
        // Navigate to game page
        navigate(`/game/${game.gameId}`);
        
        // After successful navigation, we keep the flag for this session
        // It will be cleared when the browser/tab is closed
      } catch (error) {
        console.error('Error joining game:', error);
        setError('Failed to join game. Please check the code and try again.');
        setLoading(false);
        // Remove the flag if joining failed
        sessionStorage.removeItem(joinFlag);
      }
    };
    
    if (user && accessToken) {
      handleJoin();
    }
  }, [gameCode, user, accessToken, navigate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Joining game...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default JoinGame;