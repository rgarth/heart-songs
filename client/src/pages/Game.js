// client/src/pages/Game.js - Complete with Winner Question Selection
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

// Helper to get winner information with edge case handling
const getWinnerInfo = (game) => {
  if (!game.submissions || game.submissions.length === 0) {
    return { winner: null, isTie: false, reason: 'no_submissions' };
  }

  const actualSubmissions = game.submissions.filter(s => !s.hasPassed);
  
  if (actualSubmissions.length === 0) {
    return { winner: null, isTie: false, reason: 'no_submissions' };
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
  
  // Check for ties at the top
  const tiedSubmissions = sortedSubmissions.filter(s => 
    (s.votes?.length || 0) === topVotes
  );
  
  if (tiedSubmissions.length > 1) {
    // Handle tie case - use submission time as tie-breaker
    const earliestSubmission = tiedSubmissions.sort((a, b) => 
      new Date(a.submittedAt) - new Date(b.submittedAt)
    )[0];
    
    return { 
      winner: earliestSubmission.player, 
      isTie: true, 
      reason: 'tie_broken_by_speed',
      tiedPlayers: tiedSubmissions.map(s => s.player)
    };
  }
  
  return { winner: topSubmission.player, isTie: false, reason: 'clear_winner' };
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
    storageChecked: false
  });
  
  // Scroll to top when game status changes
  useEffect(() => {
    if (game && game.status !== prevGameStatusRef.current) {
      window.scrollTo(0, 0);
      prevGameStatusRef.current = game.status;
    }
  }, [game]);
  
  // Load game history from localStorage
  const loadGameHistoryFromStorage = useCallback(() => {
    if (!gameId || gameHistory.storageChecked) return null;
    
    try {
      const possibleKeys = [
        `gameHistory_${gameId}`,
        `game_history_${gameId}`,
        `history_${gameId}`
      ];
      
      const allKeys = Object.keys(localStorage);
      const matchingKeys = allKeys.filter(key => 
        key.includes('gameHistory') && key.includes(gameId)
      );
      
      const keysToCheck = [...new Set([...possibleKeys, ...matchingKeys])];
      
      for (const key of keysToCheck) {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            
            if (parsedData && 
                parsedData.previousRounds && 
                Array.isArray(parsedData.previousRounds) && 
                parsedData.previousRounds.length > 0) {
              
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
      const storageKey = `gameHistory_${gameId}`;
      
      const dataToStore = {
        previousRounds: rounds,
        gameId: gameId,
        gameCode: gameData?.gameCode || 'unknown',
        roundsCount: rounds.length,
        savedAt: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(dataToStore);
      localStorage.setItem(storageKey, jsonData);
      
      const timestampKey = `gameHistory_${gameId}_${Date.now()}`;
      localStorage.setItem(timestampKey, jsonData);
      
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
    
    const token = accessToken || localStorage.getItem('accessToken');
    
    if (!token) {
      console.error("No authentication token available");
      setError('Authentication error. Please login again.');
      setLoading(false);
      return;
    }
    
    try {
      const gameData = await getGameState(gameId, token);
      
      if (retryCount > 0) setRetryCount(0);
      
      if (gameData.status === 'ended') {
        if (!gameData.previousRounds || !Array.isArray(gameData.previousRounds) || gameData.previousRounds.length === 0) {
          if (!gameHistory.storageChecked) {
            const loadedRounds = loadGameHistoryFromStorage();
            if (loadedRounds) {
              gameData.previousRounds = loadedRounds;
            }
          } else if (gameHistory.previousRounds.length > 0) {
            gameData.previousRounds = gameHistory.previousRounds;
          }
        }
      }
      
      setGame(prevGame => {
        if (!prevGame) return gameData;
        
        const hasStatusChanged = prevGame.status !== gameData.status;
        const hasSubmissionsCountChanged = 
          (prevGame.submissions?.length || 0) !== (gameData.submissions?.length || 0);
        
        const hasCountdownChanged = 
          prevGame.countdown?.isActive !== gameData.countdown?.isActive ||
          prevGame.countdown?.type !== gameData.countdown?.type;
        
        const prevVotesCounts = JSON.stringify(
          prevGame.submissions?.map(s => s.votes?.length) || []
        );
        const newVotesCounts = JSON.stringify(
          gameData.submissions?.map(s => s.votes?.length) || []
        );
        const hasVotesChanged = prevVotesCounts !== newVotesCounts;
        
        const prevReadyCounts = (prevGame.players || []).filter(p => p.isReady).length;
        const newReadyCounts = (gameData.players || []).filter(p => p.isReady).length;
        const hasReadyStatusChanged = prevReadyCounts !== newReadyCounts;
        
        const hasPlayersChanged = 
          (prevGame.players?.length || 0) !== (gameData.players?.length || 0);
          
        const prevActivePlayers = JSON.stringify(prevGame.activePlayers || []);
        const newActivePlayers = JSON.stringify(gameData.activePlayers || []);
        const hasActivePlayersChanged = prevActivePlayers !== newActivePlayers;

        // Check for winner selected question changes
        const hasWinnerQuestionChanged = 
          JSON.stringify(prevGame.winnerSelectedQuestion) !== JSON.stringify(gameData.winnerSelectedQuestion);
        
        if (
          hasStatusChanged || 
          hasSubmissionsCountChanged || 
          hasVotesChanged || 
          hasReadyStatusChanged || 
          hasPlayersChanged ||
          hasActivePlayersChanged ||
          hasCountdownChanged ||
          hasWinnerQuestionChanged
        ) {
          if (prevGame.status === 'results' && gameData.status === 'selecting') {
            const roundData = {
              question: prevGame.currentQuestion,
              submissions: [...prevGame.submissions]
            };
            
            const updatedRounds = [...gameHistory.previousRounds, roundData];
            
            setGameHistory(prev => ({
              ...prev,
              previousRounds: updatedRounds
            }));
            
            saveGameHistoryToStorage(updatedRounds, gameData);
          }

          if (gameData.finalRoundData) {
            gameData.finalRoundSubmissions = gameData.finalRoundData.submissions;
          }
          
          return gameData;
        }
        
        return prevGame;
      });
      
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
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

    fetchGameState();
    
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
      
      await startNewRound(gameId, questionData, token);
    } catch (error) {
      console.error('Error starting new round:', error);
      setError('Failed to start new round. Please try again.');
    }
  };

  // NEW: Handle moving to question selection phase
  const handleMoveToQuestionSelection = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      // Call API to move game to question-selection status
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api'}/game/move-to-question-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to move to question selection');
      }
      
      // Game state will update via polling
    } catch (error) {
      console.error('Error moving to question selection:', error);
      setError('Failed to move to question selection. Please try again.');
    }
  };

  // NEW: Handle when winner selects a question
  const handleWinnerQuestionSelected = async (questionData) => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      // Call API to save winner's selected question
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api'}/game/set-winner-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          gameId, 
          questionText: questionData.text,
          questionCategory: questionData.category 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to set winner question');
      }
      
      // Game state will update via polling
    } catch (error) {
      console.error('Error setting winner question:', error);
      setError('Failed to set winner question. Please try again.');
    }
  };

  // NEW: Handle host override (fallback to normal question selection)
  const handleHostOverride = async () => {
    try {
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      // Move back to results so host can use normal question selection
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api'}/game/host-override-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to override question selection');
      }
      
    } catch (error) {
      console.error('Error with host override:', error);
      setError('Failed to override question selection. Please try again.');
    }
  };
  
  // Handle ending the game
  const handleEndGame = async () => {
    try {
      if (!user || !user.id) {
        setError('User information missing. Please login again.');
        return;
      }
      
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication error. Please login again.');
        return;
      }
      
      if (game && game.status === 'results' && game.submissions && game.submissions.length > 0) {
        const roundData = {
          question: game.currentQuestion,
          submissions: [...game.submissions].sort((a, b) => {
            const votesA = a?.votes?.length || 0;
            const votesB = b?.votes?.length || 0;
            return votesB - votesA;
          })
        };
        
        const updatedPreviousRounds = [...gameHistory.previousRounds, roundData];
        
        setGameHistory(prev => ({
          ...prev,
          previousRounds: updatedPreviousRounds
        }));
        
        saveGameHistoryToStorage(updatedPreviousRounds, game);
        
        await endGame(gameId, token);
        
        setGame(prevGame => ({
          ...prevGame,
          status: 'ended',
          previousRounds: updatedPreviousRounds,
          finalRoundData: roundData,
          allRoundsCount: updatedPreviousRounds.length
        }));
      } else {
        await endGame(gameId, token);
        
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

        {/* NEW: Question Selection Screen */}
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