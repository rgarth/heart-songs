// client/src/pages/Game.js - Add countdown state management
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getGameState, toggleReady, startNewRound, startGame, endGame } from '../services/gameService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LobbyScreen from '../components/game/LobbyScreen';
import SelectionScreen from '../components/game/SelectionScreen';
import VotingScreen from '../components/game/VotingScreen';
import ResultsScreen from '../components/game/ResultsScreen';
import FinalResultsScreen from '../components/game/FinalResultsScreen';
import CountdownBanner from '../components/game/CountdownBanner';

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
  const [copySuccess, setCopySuccess] = useState(false);
  
  // NEW: Countdown state management
  const [countdownState, setCountdownState] = useState({
    isActive: false,
    type: null, // 'selection' or 'voting'
    timeLeft: 10,
    message: ''
  });
  
  // Add state to track game history for the final results
  const [gameHistory, setGameHistory] = useState({
    previousRounds: []
  });
  
  // Copy game code to clipboard
  const copyGameCode = () => {
    if (!game || !game.gameCode) return;
    
    try {
      navigator.clipboard.writeText(game.gameCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };
  
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
      
      // Deep copy the current game state to use for final results
      const finalGameState = JSON.parse(JSON.stringify(game));
      
      // Store current round data in game history before ending
      if (finalGameState && finalGameState.status === 'results' && finalGameState.submissions && finalGameState.submissions.length > 0) {
        // Create the roundData for the current final round
        const roundData = {
          question: finalGameState.currentQuestion,
          submissions: [...finalGameState.submissions].sort((a, b) => {
            const votesA = a?.votes?.length || 0;
            const votesB = b?.votes?.length || 0;
            return votesB - votesA;
          })
        };
        
        // Update game history with the final round included
        const updatedPreviousRounds = [...(gameHistory.previousRounds || []), roundData];
        
        // Update local game history state
        setGameHistory(prevHistory => ({
          ...prevHistory,
          previousRounds: updatedPreviousRounds
        }));
        
        // Call API to end the game on the server
        await endGame(gameId, token);
        
        // Update game status with all the data we need to render final results
        setGame(prevGame => {
          const updatedGame = {
            ...prevGame,
            status: 'ended',
            previousRounds: updatedPreviousRounds, // Add our local copy of all rounds including final round
            finalRoundData: roundData, // Add the final round explicitly as a separate property
            allRoundsCount: updatedPreviousRounds.length // Add a count for debugging
          };
          return updatedGame;
        });
        
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
  
  // NEW: Countdown handlers
  const startCountdown = (type, message) => {
    setCountdownState({
      isActive: true,
      type,
      timeLeft: 10,
      message
    });
  };
  
  const handleCountdownComplete = () => {
    // The actual ending is handled by the respective screens
    setCountdownState({
      isActive: false,
      type: null,
      timeLeft: 10,
      message: ''
    });
  };
  
  const handleCountdownCancel = () => {
    setCountdownState({
      isActive: false,
      type: null,
      timeLeft: 10,
      message: ''
    });
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

  // Render appropriate game screen based on game status
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header gameCode={game.gameCode} />
      
      {/* NEW: Countdown Banner */}
      <CountdownBanner
        isActive={countdownState.isActive}
        initialSeconds={10}
        message={countdownState.message}
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
        showCancelButton={user && game.host._id === user.id} // Only host can cancel
      />
      
      {/* Add top padding when countdown is active */}
      <div className={`container mx-auto px-4 py-6 flex-1 ${countdownState.isActive ? 'mt-16' : ''}`}>
        {/* Display game code prominently in waiting status */}
        {game.status === 'waiting' && (
          <div className="mb-6 text-center">
            <div className="bg-gray-800 rounded-lg py-3 px-4 inline-block mx-auto">
              <p className="text-sm text-gray-400 mb-1">Game Code:</p>
              <div className="flex items-center justify-center">
                <p className="text-3xl font-bold tracking-wider bg-gray-700 px-4 py-2 rounded-lg text-yellow-400 font-mono">
                  {game.gameCode}
                </p>
                <button 
                  onClick={copyGameCode}
                  className="ml-2 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 focus:outline-none"
                  aria-label="Copy game code"
                  title="Copy game code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
              {copySuccess && (
                <p className="text-green-400 text-sm mt-1">
                  Copied to clipboard!
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">Share this code with friends to let them join</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mb-6">
          <button
            onClick={handleLeaveGame}
            className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Leave Game
          </button>
        </div>

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
            onStartCountdown={startCountdown}
          />
        )}
        
        {game.status === 'voting' && (
          <VotingScreen 
            game={game}
            currentUser={user}
            accessToken={accessToken}
            sessionToken={accessToken} // Updated: Pass accessToken as sessionToken
            onStartCountdown={startCountdown}
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
      <Footer />
    </div>
  );
};

export default Game;