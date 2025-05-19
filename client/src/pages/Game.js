// Modify client/src/pages/Game.js to add the scroll-to-top functionality
// The key changes are adding a useEffect that watches for game.status changes

import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getGameState, toggleReady, startNewRound, startGame, endGame, cancelCountdown } from '../services/gameService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LobbyScreen from '../components/game/LobbyScreen';
import SelectionScreen from '../components/game/SelectionScreen';
import VotingScreen from '../components/game/VotingScreen';
import ResultsScreen from '../components/game/ResultsScreen';
import FinalResultsScreen from '../components/game/FinalResultsScreen';
import CountdownBanner from '../components/game/CountdownBanner';

// Polling intervals
const POLLING_INTERVAL = 2000;
const MAX_RETRY_ATTEMPTS = 3;

// Calculate time left for countdown (outside component)
const getTimeLeft = (countdown) => {
  if (!countdown || !countdown.isActive || !countdown.startedAt) {
    return 0;
  }
  
  const startTime = new Date(countdown.startedAt);
  const now = new Date();
  const elapsed = Math.floor((now - startTime) / 1000);
  const timeLeft = Math.max(0, countdown.duration - elapsed);
  return timeLeft;
};

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Add a ref to track the previous game status
  const prevGameStatusRef = useRef(null);
  
  // Add state to track game history for the final results
  const [gameHistory, setGameHistory] = useState({
    previousRounds: [],
    storageChecked: false // Flag to track if we've checked localStorage already
  });
  
  // Scroll to top when game status changes
  useEffect(() => {
    if (game && game.status !== prevGameStatusRef.current) {
      // Game status has changed, scroll to top
      window.scrollTo(0, 0);
      
      // Update the previous status ref
      prevGameStatusRef.current = game.status;
    }
  }, [game?.status]);
  
  // Improved function to load game history from localStorage
  const loadGameHistoryFromStorage = useCallback(() => {
    if (!gameId || gameHistory.storageChecked) return null;
    
    try {
      // Try multiple key formats to increase chances of finding data
      const possibleKeys = [
        `gameHistory_${gameId}`,
        `game_history_${gameId}`,
        `history_${gameId}`
      ];
      
      // Also check for any key that contains this gameId
      const allKeys = Object.keys(localStorage);
      const matchingKeys = allKeys.filter(key => 
        key.includes('gameHistory') && key.includes(gameId)
      );
      
      // Combine all possible keys
      const keysToCheck = [...new Set([...possibleKeys, ...matchingKeys])];
      
      console.log(`Checking ${keysToCheck.length} possible storage keys for game history`);
      
      // Try each key
      for (const key of keysToCheck) {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            
            if (parsedData && 
                parsedData.previousRounds && 
                Array.isArray(parsedData.previousRounds) && 
                parsedData.previousRounds.length > 0) {
              
              console.log(`Successfully loaded ${parsedData.previousRounds.length} rounds from localStorage using key: ${key}`);
              
              // Mark as checked so we don't try again
              setGameHistory(prev => ({
                ...prev,
                previousRounds: parsedData.previousRounds,
                storageChecked: true
              }));
              
              return parsedData.previousRounds;
            }
          } catch (parseError) {
            console.warn(`Failed to parse data from key ${key}:`, parseError);
          }
        }
      }
      
      // If we get here, we checked all possible keys but found nothing
      console.log('No valid game history found in localStorage');
      setGameHistory(prev => ({
        ...prev,
        storageChecked: true
      }));
      
    } catch (storageError) {
      console.error('Error accessing localStorage:', storageError);
      setGameHistory(prev => ({
        ...prev,
        storageChecked: true
      }));
    }
    
    return null;
  }, [gameId, gameHistory.storageChecked]);
  
  // Save history to localStorage
  const saveGameHistoryToStorage = useCallback((rounds, gameData) => {
    if (!gameId || !rounds || !Array.isArray(rounds) || rounds.length === 0) return;
    
    try {
      // Use a consistent key format
      const storageKey = `gameHistory_${gameId}`;
      
      const dataToStore = {
        previousRounds: rounds,
        gameId: gameId,
        gameCode: gameData?.gameCode || 'unknown',
        roundsCount: rounds.length,
        savedAt: new Date().toISOString()
      };
      
      // Convert to string and save
      const jsonData = JSON.stringify(dataToStore);
      localStorage.setItem(storageKey, jsonData);
      
      console.log(`Successfully saved ${rounds.length} rounds to localStorage with key: ${storageKey}`);
      
      // For troubleshooting, also save a second copy with timestamp
      const timestampKey = `gameHistory_${gameId}_${Date.now()}`;
      localStorage.setItem(timestampKey, jsonData);
      console.log(`Backup saved with key: ${timestampKey}`);
      
    } catch (storageError) {
      console.error('Failed to save game history to localStorage:', storageError);
    }
  }, [gameId]);
  
  // Load history on mount
  useEffect(() => {
    loadGameHistoryFromStorage();
  }, [loadGameHistoryFromStorage]);
  
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
      if (retryCount > 0) setRetryCount(0);
      
      // If game is ended, make sure we have history
      if (gameData.status === 'ended') {
        // Check if we need to load history from localStorage
        if (!gameData.previousRounds || !Array.isArray(gameData.previousRounds) || gameData.previousRounds.length === 0) {
          // Try to load from localStorage if we haven't checked already
          if (!gameHistory.storageChecked) {
            const loadedRounds = loadGameHistoryFromStorage();
            if (loadedRounds) {
              gameData.previousRounds = loadedRounds;
            }
          } else if (gameHistory.previousRounds.length > 0) {
            // Use our stored history
            gameData.previousRounds = gameHistory.previousRounds;
          }
        }
      }
      
      // Only update state if something important has changed
      setGame(prevGame => {
        // Always update on initial load
        if (!prevGame) return gameData;
        
        // Check if important properties changed before updating
        const hasStatusChanged = prevGame.status !== gameData.status;
        const hasSubmissionsCountChanged = 
          (prevGame.submissions?.length || 0) !== (gameData.submissions?.length || 0);
        
        // Check countdown changes
        const hasCountdownChanged = 
          prevGame.countdown?.isActive !== gameData.countdown?.isActive ||
          prevGame.countdown?.type !== gameData.countdown?.type;
        
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
          hasActivePlayersChanged ||
          hasCountdownChanged
        ) {
          // If status changed from results to selecting, it means a new round started
          // Save the previous round data
          if (prevGame.status === 'results' && gameData.status === 'selecting') {
            // Add current round data to game history
            const roundData = {
              question: prevGame.currentQuestion,
              submissions: [...prevGame.submissions]
            };
            
            const updatedRounds = [...gameHistory.previousRounds, roundData];
            
            setGameHistory(prev => ({
              ...prev,
              previousRounds: updatedRounds
            }));
            
            // Save to localStorage every time we add a round
            saveGameHistoryToStorage(updatedRounds, gameData);
          }

          // If we get finalRoundData from the server, save it
          if (gameData.finalRoundData) {
            gameData.finalRoundSubmissions = gameData.finalRoundData.submissions;
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
  }, [gameId, accessToken, initialLoad, retryCount, gameHistory, loadGameHistoryFromStorage, saveGameHistoryToStorage]);
  
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
        // Create the roundData for the current final round
        const roundData = {
          question: game.currentQuestion,
          submissions: [...game.submissions].sort((a, b) => {
            const votesA = a?.votes?.length || 0;
            const votesB = b?.votes?.length || 0;
            return votesB - votesA;
          })
        };
        
        // Update game history with the final round included
        const updatedPreviousRounds = [...gameHistory.previousRounds, roundData];
        
        // Update local game history state
        setGameHistory(prev => ({
          ...prev,
          previousRounds: updatedPreviousRounds
        }));
        
        // Save the updated rounds to localStorage
        saveGameHistoryToStorage(updatedPreviousRounds, game);
        
        // Call API to end the game on the server
        await endGame(gameId, token);
        
        // Update game status with all the data we need to render final results
        setGame(prevGame => ({
          ...prevGame,
          status: 'ended',
          previousRounds: updatedPreviousRounds,
          finalRoundData: roundData,
          allRoundsCount: updatedPreviousRounds.length
        }));
      } else {
        // Call API to end the game on the server
        await endGame(gameId, token);
        
        // Just update the status if no round data to save
        setGame(prevGame => ({
          ...prevGame,
          status: 'ended'
        }));
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
  
  // Handle countdown cancel (only for host)
  const handleCountdownCancel = async () => {
    if (!game || !game.countdown?.isActive) return;
    
    try {
      // Get the most up-to-date token
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await cancelCountdown(gameId, token);
    } catch (error) {
      console.error('Error canceling countdown:', error);
      setError('Failed to cancel countdown. Please try again.');
    }
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
      <div className="flex flex-col min-h-screen bg-gray-900">
        <Header />
        <div className="flex items-center justify-center flex-1">
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
      </div>
    );
  }

  // Game not found
  if (!game) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <Header />
        <div className="flex items-center justify-center flex-1">
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
      </div>
    );
  }

  // Calculate current countdown time left if active
  const currentTimeLeft = game.countdown?.isActive ? getTimeLeft(game.countdown) : 0;
  
  // Render appropriate game screen based on game status
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header gameCode={game.gameCode} />
      
      {/* Server-side Countdown Banner */}
      <CountdownBanner
        isActive={game.countdown?.isActive && currentTimeLeft > 0}
        initialSeconds={currentTimeLeft}
        message={game.countdown?.message || ''}
        onComplete={() => {
          // Don't do anything here - the server handles the countdown completion
        }}
        onCancel={handleCountdownCancel}
        showCancelButton={user && game.host._id === user.id}
      />
      
      {/* Add top padding when countdown is active */}
      <div className={`container mx-auto px-4 py-6 flex-1 ${game.countdown?.isActive ? 'mt-16' : ''}`}>
        
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
              // Combine previousRounds sources - prioritize server data, then local history
              previousRounds: game.previousRounds?.length > 0 
                ? game.previousRounds 
                : gameHistory.previousRounds
            }}
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            accessToken={accessToken || localStorage.getItem('accessToken')}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Game;