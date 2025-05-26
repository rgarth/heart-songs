// client/src/pages/Game.js - Restored with localStorage Logic
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getGameState, toggleReady, startNewRound, startGame, endGame, cancelCountdown, moveToQuestionSelection, setWinnerSelectedQuestion, hostOverrideQuestion } from '../services/gameService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LobbyScreen from '../components/game/LobbyScreen';
import SelectionScreen from '../components/game/SelectionScreen';
import VotingScreen from '../components/game/VotingScreen';
import ResultsScreen from '../components/game/ResultsScreen';
import QuestionSelectionScreen from '../components/game/QuestionSelectionScreen';
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

// Fixed getWinnerInfo function for Game.js
// Helper to get winner information with edge case handling
const getWinnerInfo = (game) => {
  // Add debug logging to see what's happening
  console.log('🏆 getWinnerInfo Debug:', {
    totalSubmissions: game.submissions?.length || 0,
    submissions: game.submissions?.map(s => ({
      player: s.player?.displayName || 'Unknown',
      hasPassed: s.hasPassed,
      songName: s.songName
    })) || []
  });

  if (!game.submissions || game.submissions.length === 0) {
    console.log('🏆 No submissions at all');
    return { winner: null, isTie: false, reason: 'no_submissions' };
  }

  // Filter out passed submissions
  const actualSubmissions = game.submissions.filter(s => s.hasPassed !== true);
  
  console.log('🏆 Actual submissions (non-passed):', {
    count: actualSubmissions.length,
    submissions: actualSubmissions.map(s => ({
      player: s.player?.displayName || 'Unknown',
      songName: s.songName,
      votes: s.votes?.length || 0
    }))
  });
  
  // Handle case where everyone passed
  if (actualSubmissions.length === 0) {
    console.log('🏆 All players passed - no winner');
    return { winner: null, isTie: false, reason: 'all_passed' };
  }
  
  // Sort by votes, then by submission time (speed bonus consideration)
  const sortedSubmissions = [...actualSubmissions].sort((a, b) => {
    const voteDiff = (b.votes?.length || 0) - (a.votes?.length || 0);
    if (voteDiff !== 0) return voteDiff;
    
    // Tie-breaker: earlier submission wins (speed bonus logic)
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });
  
  const topSubmission = sortedSubmissions[0];
  const topVotes = topSubmission.votes?.length || 0;
  
  console.log('🏆 Top submission:', {
    player: topSubmission.player?.displayName || 'Unknown',
    songName: topSubmission.songName,
    votes: topVotes
  });
  
  // Check for ties at the top
  const tiedSubmissions = sortedSubmissions.filter(s => 
    (s.votes?.length || 0) === topVotes
  );
  
  if (tiedSubmissions.length > 1) {
    // Handle tie case - use submission time as tie-breaker
    const earliestSubmission = tiedSubmissions.sort((a, b) => 
      new Date(a.submittedAt) - new Date(b.submittedAt)
    )[0];
    
    console.log('🏆 Tie detected, winner by speed:', {
      winner: earliestSubmission.player?.displayName || 'Unknown',
      tiedCount: tiedSubmissions.length
    });
    
    return { 
      winner: earliestSubmission.player, 
      isTie: true, 
      reason: 'tie_broken_by_speed',
      tiedPlayers: tiedSubmissions.map(s => s.player)
    };
  }
  
  console.log('🏆 Clear winner:', {
    winner: topSubmission.player?.displayName || 'Unknown'
  });
  
  return { 
    winner: topSubmission.player, 
    isTie: false, 
    reason: 'clear_winner' 
  };
};

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs to prevent unnecessary re-renders
  const prevGameRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // RESTORED: Game history state management
  const [gameHistory, setGameHistory] = useState([]);
  const gameHistoryRef = useRef([]);
  const hasInitializedHistoryRef = useRef(false);
  
  // RESTORED: localStorage key management
  const getStorageKey = useCallback(() => {
    if (!gameId) return null;
    return `gameHistory_${gameId}`;
  }, [gameId]);
  
  // RESTORED: Save game history to localStorage
  const saveGameHistoryToStorage = useCallback((history, gameData) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
      const historyData = {
        gameId: gameData._id || gameData.gameId,
        gameCode: gameData.gameCode,
        previousRounds: history,
        savedAt: new Date().toISOString(),
        status: gameData.status
      };
      
      localStorage.setItem(storageKey, JSON.stringify(historyData));
      console.log(`💾 Saved game history to localStorage with ${history.length} rounds`);
    } catch (error) {
      console.error('Error saving game history to localStorage:', error);
    }
  }, [getStorageKey]);
  
  // RESTORED: Load game history from localStorage
  const loadGameHistoryFromStorage = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return [];
    
    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        console.log(`📂 Loaded game history from localStorage with ${parsed.previousRounds?.length || 0} rounds`);
        return parsed.previousRounds || [];
      }
    } catch (error) {
      console.error('Error loading game history from localStorage:', error);
    }
    
    return [];
  }, [getStorageKey]);
  
  // RESTORED: Update game history logic
  const updateGameHistory = useCallback((gameData) => {
    if (!gameData) return;
    
    // Initialize history from localStorage if we haven't yet
    if (!hasInitializedHistoryRef.current) {
      const loadedHistory = loadGameHistoryFromStorage();
      if (loadedHistory.length > 0) {
        setGameHistory(loadedHistory);
        gameHistoryRef.current = loadedHistory;
        console.log(`🔄 Initialized game history with ${loadedHistory.length} rounds from localStorage`);
      }
      hasInitializedHistoryRef.current = true;
    }
    
    // Handle different game states
    if (gameData.status === 'ended') {
      // Game has ended - preserve all history
      let finalHistory = [];
      
      // Start with existing history
      if (gameHistoryRef.current.length > 0) {
        finalHistory = [...gameHistoryRef.current];
      }
      
      // Add server's previous rounds if available
      if (gameData.previousRounds && Array.isArray(gameData.previousRounds)) {
        const serverRounds = gameData.previousRounds.filter(round => 
          !finalHistory.some(existing => 
            existing.question?.text === round.question?.text
          )
        );
        finalHistory = [...finalHistory, ...serverRounds];
      }
      
      // Add final round data if available
      if (gameData.submissions && Array.isArray(gameData.submissions) && gameData.submissions.length > 0) {
        const finalRound = {
          question: gameData.currentQuestion,
          submissions: gameData.submissions,
          playersWhoFailedToSubmit: gameData.currentRound?.playersWhoFailedToSubmit || [],
          playersWhoFailedToVote: gameData.currentRound?.playersWhoFailedToVote || []
        };
        
        // Only add if it's not already in the history
        const isDuplicate = finalHistory.some(round => 
          round.question?.text === finalRound.question?.text
        );
        
        if (!isDuplicate) {
          finalHistory.push(finalRound);
        }
      }
      
      // Update state and save to localStorage
      if (finalHistory.length > 0) {
        setGameHistory(finalHistory);
        gameHistoryRef.current = finalHistory;
        saveGameHistoryToStorage(finalHistory, gameData);
        console.log(`🏁 Final game history: ${finalHistory.length} rounds`);
      }
    } else if (gameData.status === 'results' && gameData.submissions && Array.isArray(gameData.submissions)) {
      // Game is in results - save current round
      const currentRoundData = {
        question: gameData.currentQuestion,
        submissions: gameData.submissions,
        playersWhoFailedToSubmit: gameData.currentRound?.playersWhoFailedToSubmit || [],
        playersWhoFailedToVote: gameData.currentRound?.playersWhoFailedToVote || []
      };
      
      // Check if this round is already in our history
      const isDuplicate = gameHistoryRef.current.some(round => 
        round.question?.text === currentRoundData.question?.text
      );
      
      if (!isDuplicate) {
        const updatedHistory = [...gameHistoryRef.current, currentRoundData];
        setGameHistory(updatedHistory);
        gameHistoryRef.current = updatedHistory;
        saveGameHistoryToStorage(updatedHistory, gameData);
        console.log(`📝 Added round to history. Total rounds: ${updatedHistory.length}`);
      }
    } else if (gameData.status === 'selecting' || gameData.status === 'voting') {
      // Game moved to new round - preserve existing history
      if (gameData.previousRounds && Array.isArray(gameData.previousRounds)) {
        const serverRounds = gameData.previousRounds.filter(round => 
          !gameHistoryRef.current.some(existing => 
            existing.question?.text === round.question?.text
          )
        );
        
        if (serverRounds.length > 0) {
          const updatedHistory = [...gameHistoryRef.current, ...serverRounds];
          setGameHistory(updatedHistory);
          gameHistoryRef.current = updatedHistory;
          saveGameHistoryToStorage(updatedHistory, gameData);
          console.log(`🔄 Updated history with server rounds. Total rounds: ${updatedHistory.length}`);
        }
      }
    }
  }, [loadGameHistoryFromStorage, saveGameHistoryToStorage]);
  
  // Scroll to top when game status changes
  useEffect(() => {
    if (game && prevGameRef.current && game.status !== prevGameRef.current.status) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto' // instant scroll for game transitions
        });
      });
    }
    prevGameRef.current = game;
  }, [game]);
  
  // UPDATED: Fetch function with game history updates
  const fetchGameState = useCallback(async () => {
    if (!gameId || !isMountedRef.current) return;
    
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) {
      setError('Authentication error. Please login again.');
      setLoading(false);
      return;
    }
    
    try {
      const gameData = await getGameState(gameId, token);
      
      if (!isMountedRef.current) return;
      
      // Reset retry count on success
      if (retryCount > 0) setRetryCount(0);
      
      // RESTORED: Update game history
      updateGameHistory(gameData);
      
      setGame(prevGame => {
        if (!prevGame) return gameData;
        
        // Simple comparison to avoid unnecessary updates
        const hasChanged = JSON.stringify(prevGame) !== JSON.stringify(gameData);
        return hasChanged ? gameData : prevGame;
      });
      
      if (loading) setLoading(false);
      
    } catch (error) {
      console.error('Error fetching game state:', error);
      
      if (!isMountedRef.current) return;
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        setError('Failed to load game after multiple attempts. Please try again.');
        setLoading(false);
      }
    }
  }, [gameId, accessToken, loading, retryCount, updateGameHistory]);
  
  // Single useEffect for polling
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchGameState();
    
    // Set up polling only if game is not ended
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current && !error) {
          fetchGameState();
        }
      }, POLLING_INTERVAL);
    };
    
    startPolling();
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchGameState, error]);
  
  // Stop polling when game ends
  useEffect(() => {
    if (game?.status === 'ended' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [game?.status]);
  
  // Handle ready toggle
  const handleToggleReady = async () => {
    try {
      if (!user?.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
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
      if (!user?.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
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
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      const result = await startNewRound(gameId, questionData, token);
      
    } catch (error) {
      setError('Failed to start new round. Please try again.');
    }
  };

  // Handle moving to question selection phase
  const handleMoveToQuestionSelection = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await moveToQuestionSelection(gameId, token);
    } catch (error) {
      console.error('Error moving to question selection:', error);
      setError('Failed to move to question selection. Please try again.');
    }
  };

  // Handle when winner selects a question
  const handleWinnerQuestionSelected = async (questionData) => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await setWinnerSelectedQuestion(gameId, questionData, token);
    } catch (error) {
      console.error('Error setting winner question:', error);
      setError('Failed to set winner question. Please try again.');
    }
  };

  // Handle host override (fallback to normal question selection)
  const handleHostOverride = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await hostOverrideQuestion(gameId, token);
    } catch (error) {
      console.error('Error with host override:', error);
      setError('Failed to override question selection. Please try again.');
    }
  };
  
  // Handle ending the game
  const handleEndGame = async () => {
    try {
      if (!user?.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
      const token = accessToken || localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      await endGame(gameId, token);
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
    if (!game?.countdown?.isActive) return;
    
    try {
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
            sessionToken={accessToken}
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
            onMoveToQuestionSelection={handleMoveToQuestionSelection}
            getWinnerInfo={() => getWinnerInfo(game)}
          />
        )}

        {/* Question Selection Screen */}
        {game.status === 'question-selection' && (
          <QuestionSelectionScreen 
            game={game}
            currentUser={{
              ...user,
              accessToken: accessToken || localStorage.getItem('accessToken')
            }}
            onQuestionSelected={handleWinnerQuestionSelected}
            onStartRound={handleNextRound}
            onHostOverride={handleHostOverride}
            getWinnerInfo={() => getWinnerInfo(game)}
          />
        )}
        
        {game.status === 'ended' && (
          <FinalResultsScreen 
            game={{
              ...game,
              // RESTORED: Use localStorage history as primary source, with server data as fallback
              previousRounds: gameHistory.length > 0 
                ? gameHistory 
                : (game.previousRounds?.length > 0 ? game.previousRounds : [])
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