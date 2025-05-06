// client/src/pages/Game.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getGameState, toggleReady, startNewRound, startGame, endGame } from '../services/gameService';
import LobbyScreen from '../components/game/LobbyScreen';
import SelectionScreen from '../components/game/SelectionScreen';
import VotingScreen from '../components/game/VotingScreen';
import ResultsScreen from '../components/game/ResultsScreen';
import FinalResultsScreen from '../components/game/FinalResultsScreen';

// Polling interval in milliseconds
const POLLING_INTERVAL = 2000;
const MAX_RETRY_ATTEMPTS = 3;

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Add state to track game history for the final results
  const [gameHistory, setGameHistory] = useState({
    previousRounds: []
  });
  
  // Fetch game state with optimized polling
  const fetchGameState = useCallback(async () => {
    if (!gameId) {
      console.error("No gameId provided to Game component");
      setError('Game ID is missing. Please go back and try again.');
      setLoading(false);
      return;
    }
    
    // Get the most up-to-date token
    const token = accessToken || localStorage.getItem('accessToken');
    
    if (!token) {
      console.error("No authentication token available");
      setError('Authentication error. Please login again.');
      setLoading(false);
      return;
    }
    
    try {
      const gameData = await getGameState(gameId, token);
      
      // Reset retry counter on success
      if (retryCount > 0) {
        setRetryCount(0);
      }
      
      // Only update state if something important has changed
      setGame(prevGame => {
        // Always update on initial load
        if (!prevGame) return gameData;
        
        // Check if important properties changed before updating
        const hasStatusChanged = prevGame.status !== gameData.status;
        const hasSubmissionsCountChanged = 
          (prevGame.submissions?.length || 0) !== (gameData.submissions?.length || 0);
        
        // Compare votes by stringifying arrays of vote counts
        const prevVotesCounts = JSON.stringify(
          prevGame.submissions?.map(s => s.votes?.length) || []
        );
        const newVotesCounts = JSON.stringify(
          gameData.submissions?.map(s => s.votes?.length) || []
        );
        const hasVotesChanged = prevVotesCounts !== newVotesCounts;
        
        // Compare players ready status
        const prevReadyCounts = (prevGame.players || []).filter(p => p.isReady).length;
        const newReadyCounts = (gameData.players || []).filter(p => p.isReady).length;
        const hasReadyStatusChanged = prevReadyCounts !== newReadyCounts;
        
        // Check if players have changed
        const hasPlayersChanged = 
          (prevGame.players?.length || 0) !== (gameData.players?.length || 0);
          
        // Check if activePlayers have changed
        const prevActivePlayers = JSON.stringify(prevGame.activePlayers || []);
        const newActivePlayers = JSON.stringify(gameData.activePlayers || []);
        const hasActivePlayersChanged = prevActivePlayers !== newActivePlayers;
        
        if (
          hasStatusChanged || 
          hasSubmissionsCountChanged || 
          hasVotesChanged || 
          hasReadyStatusChanged || 
          hasPlayersChanged ||
          hasActivePlayersChanged
        ) {
          // If status changed from results to selecting, it means a new round started
          // Save the previous round data
          if (prevGame.status === 'results' && gameData.status === 'selecting') {
            // Add current round data to game history
            setGameHistory(prev => {
              const roundData = {
                question: prevGame.currentQuestion,
                submissions: [...prevGame.submissions]
              };
              
              return {
                ...prev,
                previousRounds: [...prev.previousRounds, roundData]
              };
            });
          }
          
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
      
      // Increment retry counter
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // If we've exceeded max retries, show error
      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        setError('Failed to load game after multiple attempts. Please try again.');
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [gameId, accessToken, initialLoad, retryCount]);
  
  // Set up polling
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    // Initial fetch
    fetchGameState();
    
    // Setup polling
    intervalId = setInterval(() => {
      if (isMounted && !error && game?.status !== 'ended') {
        fetchGameState();
      }
    }, POLLING_INTERVAL);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchGameState, error, game?.status]);
  
  // Handle ready toggle
  const handleToggleReady = async () => {
    try {
      if (!user || !user.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
      // Get the most up-to-date token
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await toggleReady(gameId, user.id, token);
    } catch (error) {
      console.error('Error toggling ready status:', error);
      setError('Failed to update ready status. Please try again.');
    }
  };
  
  // Handle force start game (host only)
  const handleStartGame = async (questionData = null) => {
    try {
      if (!user || !user.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
      // Get the most up-to-date token
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await startGame(gameId, user.id, token, questionData);
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start game. Please try again.');
    }
  };
  
  // Handle starting a new round with selected or custom question
  const handleNextRound = async (questionData) => {
    try {
      // Get the most up-to-date token
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await startNewRound(gameId, questionData, token);
    } catch (error) {
      console.error('Error starting new round:', error);
      setError('Failed to start new round. Please try again.');
    }
  };
  
  // Improved handleEndGame function for Game.js

// Handle ending the game
const handleEndGame = async () => {
  try {
    if (!user || !user.id) {
      setError('User information missing. Please login again.');
      return;
    }
    
    // Get the most up-to-date token
    const token = accessToken || localStorage.getItem('accessToken');
    
    if (!token) {
      setError('Authentication error. Please login again.');
      return;
    }
    
    // Store current round data in game history before ending
    if (game && game.status === 'results' && game.submissions && game.submissions.length > 0) {
      // Make sure to save the winning song from the current round
      setGameHistory(prev => {
        const roundData = {
          question: game.currentQuestion,
          submissions: [...game.submissions].sort((a, b) => b.votes.length - a.votes.length)
        };
        
        return {
          ...prev,
          previousRounds: [...prev.previousRounds, roundData]
        };
      });
    }
    
    // Update game status locally without waiting for server
    setGame(prevGame => ({
      ...prevGame,
      status: 'ended'
    }));
    
    // Call API to end the game on the server
    const response = await endGame(gameId, token);
    
    // If the server response includes playlist data, update our state
    if (response && response.playlist) {
      console.log('Received playlist data from server:', response.playlist.length, 'tracks');
    }
    
  } catch (error) {
    console.error('Error ending game:', error);
    setError('Failed to end game. Please try again.');
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
          <p className="text-gray-400 text-sm mt-2">Game ID: {gameId}</p>
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
          <div className="text-sm text-gray-400 mb-4">
            <p>Game ID: {gameId}</p>
            <p>User ID: {user?.id}</p>
            <p>Has Token: {accessToken ? 'Yes' : 'No'}</p>
          </div>
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
          <div className="text-sm text-gray-400 mb-4">
            <p>Game ID: {gameId}</p>
            <p>User ID: {user?.id}</p>
            <p>Has Token: {accessToken ? 'Yes' : 'No'}</p>
          </div>
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
            <h1 className="text-2xl font-bold">Heart Songs</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-400 mr-2">Game Code:</span>
              <span className="text-xl font-bold tracking-wider bg-gray-800 px-3 py-1 rounded-lg text-yellow-400 font-mono">{game.gameCode}</span>
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
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            onToggleReady={handleToggleReady} 
            onStartGame={handleStartGame}
          />
        )}
        
        {game.status === 'selecting' && (
          <SelectionScreen 
            game={game}
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            accessToken={accessToken || localStorage.getItem('accessToken')}
          />
        )}
        
        {game.status === 'voting' && (
          <VotingScreen 
            game={game}
            currentUser={user}
            accessToken={accessToken}
            sessionToken={accessToken} // Updated: Pass accessToken as sessionToken
          />
        )}
        
        {game.status === 'results' && (
          <ResultsScreen 
            game={game}
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            accessToken={accessToken || localStorage.getItem('accessToken')}
            onNextRound={handleNextRound}
            onEndGame={handleEndGame}
          />
        )}
        
        {game.status === 'ended' && (
          <FinalResultsScreen 
            game={{
              ...game,
              previousRounds: gameHistory.previousRounds
            }}
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            accessToken={accessToken || localStorage.getItem('accessToken')}
          />
        )}
      </div>
    </div>
  );
};

export default Game;