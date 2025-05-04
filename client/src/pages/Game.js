// client/src/pages/Game.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getGameState, toggleReady, startNewRound, startGame } from '../services/gameService';
import LobbyScreen from '../components/game/LobbyScreen';
import SelectionScreen from '../components/game/SelectionScreen';
import VotingScreen from '../components/game/VotingScreen';
import ResultsScreen from '../components/game/ResultsScreen';

// Polling interval in milliseconds
const POLLING_INTERVAL = 2000;

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Fetch game state with optimized polling
  const fetchGameState = useCallback(async () => {
    if (!gameId || !accessToken) return;
    
    try {
      const gameData = await getGameState(gameId, accessToken);
      
      // Only update state if something important has changed
      setGame(prevGame => {
        // Always update on initial load
        if (!prevGame) return gameData;
        
        // Check if important properties changed before updating
        const hasStatusChanged = prevGame.status !== gameData.status;
        const hasSubmissionsCountChanged = prevGame.submissions?.length !== gameData.submissions?.length;
        
        // Compare votes by stringifying arrays of vote counts
        const prevVotesCounts = JSON.stringify(prevGame.submissions?.map(s => s.votes?.length) || []);
        const newVotesCounts = JSON.stringify(gameData.submissions?.map(s => s.votes?.length) || []);
        const hasVotesChanged = prevVotesCounts !== newVotesCounts;
        
        // Compare players ready status
        const prevReadyCounts = prevGame.players.filter(p => p.isReady).length;
        const newReadyCounts = gameData.players.filter(p => p.isReady).length;
        const hasReadyStatusChanged = prevReadyCounts !== newReadyCounts;
        
        // Check if players have changed
        const hasPlayersChanged = prevGame.players.length !== gameData.players.length;
        
        if (
          hasStatusChanged || 
          hasSubmissionsCountChanged || 
          hasVotesChanged || 
          hasReadyStatusChanged || 
          hasPlayersChanged
        ) {
          return gameData;
        }
        
        return prevGame; // No important change, prevent re-render
      });
      
      // Only update loading state on initial load
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      setError('Failed to fetch game state');
      setLoading(false);
      setInitialLoad(false);
    }
  }, [gameId, accessToken, initialLoad]);
  
  // Set up polling
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    // Initial fetch
    fetchGameState();
    
    // Setup polling
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchGameState();
      }
    }, POLLING_INTERVAL);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchGameState]);
  
  // Handle ready toggle
  const handleToggleReady = async () => {
    try {
      await toggleReady(gameId, user.id, accessToken);
    } catch (error) {
      console.error('Error toggling ready status:', error);
      setError('Failed to update ready status');
    }
  };
  
  // Handle force start game (host only)
  const handleStartGame = async (questionData = null) => {
    try {
      await startGame(gameId, user.id, accessToken, questionData);
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game');
    }
  };
  
  // Handle starting a new round with selected or custom question
  const handleNextRound = async (questionData) => {
    try {
      await startNewRound(gameId, questionData, accessToken);
    } catch (error) {
      console.error('Error starting new round:', error);
      setError('Failed to start new round');
    }
  };
  
  // Go back to home
  const handleLeaveGame = () => {
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={handleLeaveGame}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Game Not Found</h2>
          <p className="text-gray-300 mb-6">The game you're looking for doesn't exist or has ended.</p>
          <button
            onClick={handleLeaveGame}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate game screen based on game status
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">❤️🎵 Heart Songs</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-400 mr-2">Game Code:</span>
              <span className="text-xl font-bold tracking-wider bg-gray-800 px-3 py-1 rounded-lg text-yellow-400">{game.gameCode}</span>
            </div>
          </div>
          <button
            onClick={handleLeaveGame}
            className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Leave Game
          </button>
        </header>

        {game.status === 'waiting' && (
          <LobbyScreen 
            game={game} 
            currentUser={user} 
            onToggleReady={handleToggleReady} 
            onStartGame={handleStartGame}
          />
        )}
        
        {game.status === 'selecting' && (
          <SelectionScreen 
            game={game}
            currentUser={user}
            accessToken={accessToken}
          />
        )}
        
        {game.status === 'voting' && (
          <VotingScreen 
            game={game}
            currentUser={user}
            accessToken={accessToken}
          />
        )}
        
        {game.status === 'results' && (
          <ResultsScreen 
            game={game}
            currentUser={user}
            accessToken={accessToken}
            onNextRound={handleNextRound}
          />
        )}
      </div>
    </div>
  );
};

export default Game;