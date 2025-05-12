// client/src/services/gameService.js - Complete with debug logging
import axios from 'axios';
import { handleAuthError } from './AuthInterceptor';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Create headers with auth token
const createHeaders = (token) => {
  if (!token) {
    console.error("No access token provided to createHeaders");
    throw new Error("Authentication token is required");
  }
  
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Error handler to standardize error logging and handling
const handleRequestError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  
  // Try to handle auth errors first
  try {
    handleAuthError(error);
  } catch (authError) {
    // If it was an auth error, it will throw the custom error
    throw authError;
  }
  
  // If not an auth error, log other details
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  
  throw error;
};

// Create a new game
export const createGame = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.error("Missing required parameters for creating game:", { 
        hasUserId: !!userId, 
        hasToken: !!token,
        userId,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none' 
      });
      throw new Error('Missing required parameters: userId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/create`, 
      { userId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'creating game');
  }
};

// Join an existing game
export const joinGame = async (gameCode, userId, token) => {
  try {
    if (!gameCode || !userId || !token) {
      console.error("Missing required parameters for joining game:", { 
        hasGameCode: !!gameCode, 
        hasUserId: !!userId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameCode, userId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/join`, 
      { gameCode, userId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'joining game');
  }
};

// Toggle ready status
export const toggleReady = async (gameId, userId, token) => {
  try {
    if (!gameId || !userId || !token) {
      console.error("Missing required parameters for toggling ready:", { 
        hasGameId: !!gameId, 
        hasUserId: !!userId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId, userId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/ready`, 
      { gameId, userId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'toggling ready status');
  }
};

// Force start game (host only)
export const startGame = async (gameId, userId, token, questionData = null) => {
  try {
    if (!gameId || !userId || !token) {
      console.error("Missing required parameters for starting game:", { 
        hasGameId: !!gameId, 
        hasUserId: !!userId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId, userId and token are required');
    }
    
    const payload = { 
      gameId, 
      userId 
    };
    
    // Add question data if provided
    if (questionData) {
      payload.questionText = questionData.text;
      payload.questionCategory = questionData.category;
    }
    
    const response = await axios.post(
      `${API_URL}/game/start`,
      payload,
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'starting game');
  }
};

// Submit song selection - Updated with pass support
export const submitSong = async (gameId, userId, songData, accessToken) => {
  try {
    if (!gameId || !userId) {
      console.error("Missing required parameters for submitting song:", { 
        hasGameId: !!gameId, 
        hasUserId: !!userId
      });
      throw new Error('Missing required parameters for submitting song');
    }
    
    // Check if this is a pass submission
    const isPass = songData && songData.hasPassed === true;
    
    let payload;
    
    if (isPass) {
      // For passing, only minimal info is needed
      payload = { 
        gameId, 
        userId, 
        hasPassed: true
      };
    } else {
      // For regular song submission
      // Make sure to handle both the new and old formats of songData
      payload = { 
        gameId, 
        userId, 
        songId: songData.id,
        songName: songData.name,
        artist: songData.artist || songData.artists?.[0]?.name || 'Unknown Artist',
        albumCover: songData.albumCover || songData.albumArt || songData.album?.images?.[0]?.url || '',
        youtubeId: songData.youtubeId || null,
        preferVideo: songData.preferVideo || false,
        hasPassed: false
      };
    }
    
    const response = await axios.post(
      `${API_URL}/game/submit`, 
      payload,
      createHeaders(accessToken)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'submitting song');
  }
};

// Vote for a song
export const voteForSong = async (gameId, userId, submissionId, token) => {
  try {
    if (!gameId || !userId || !submissionId || !token) {
      console.error("Missing required parameters for voting:", { 
        hasGameId: !!gameId, 
        hasUserId: !!userId, 
        hasSubmissionId: !!submissionId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters for voting');
    }
    
    const response = await axios.post(
      `${API_URL}/game/vote`, 
      { gameId, userId, submissionId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'voting for song');
  }
};

// Get random question preview
export const getRandomQuestion = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for getting question:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.get(
      `${API_URL}/game/${gameId}/question-preview`,
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'getting question preview');
  }
};

// Submit custom question
export const submitCustomQuestion = async (gameId, questionText, token) => {
  try {
    if (!gameId || !questionText || !token) {
      console.error("Missing required parameters for custom question:", { 
        hasGameId: !!gameId, 
        hasQuestionText: !!questionText, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters for custom question');
    }
    
    const response = await axios.post(
      `${API_URL}/game/${gameId}/custom-question`,
      { questionText },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'submitting custom question');
  }
};

// Start a new round
export const startNewRound = async (gameId, questionData, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for starting new round:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const payload = { gameId };
    
    // Add question data if provided
    if (questionData) {
      payload.questionText = questionData.text;
      payload.questionCategory = questionData.category;
    }
    
    const response = await axios.post(
      `${API_URL}/game/next-round`, 
      payload,
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'starting new round');
  }
};

export const endGame = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for ending game:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/end`, 
      { gameId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'ending game');
  }
};

// Get game state - WITH DEBUG LOGGING
export const getGameState = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for getting game state:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    // Don't log every poll to avoid console spam, but do log countdown-related data
    const response = await axios.get(
      `${API_URL}/game/${gameId}`,
      createHeaders(token)
    );
    
    // ADD DEBUG LOG FOR COUNTDOWN DATA:
    if (response.data.countdown) {
      console.log('🔍 getGameState API response with countdown:', {
        status: response.data.status,
        countdown: response.data.countdown,
        hasCountdown: !!response.data.countdown,
        countdownActive: response.data.countdown?.isActive,
        countdownType: response.data.countdown?.type,
        countdownStartedAt: response.data.countdown?.startedAt,
        countdownDuration: response.data.countdown?.duration,
        countdownMessage: response.data.countdown?.message
      });
    }
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'getting game state');
  }
};

// Force end selection phase
export const endSelectionPhase = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for ending selection phase:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/end-selection`, 
      { gameId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'ending selection phase');
  }
};

// Force end voting phase
export const endVotingPhase = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for ending voting phase:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/end-voting`, 
      { gameId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'ending voting phase');
  }
};

// Start countdown for ending selection - WITH DEBUG LOGGING
export const startEndSelectionCountdown = async (gameId, token) => {
  try {
    console.log('🌐 SERVICE DEBUG 1: Starting countdown request');
    console.log('🌐 SERVICE DEBUG 2: gameId provided:', gameId);
    console.log('🌐 SERVICE DEBUG 3: Token provided:', token ? 'Yes' : 'No');
    console.log('🌐 SERVICE DEBUG 4: Token preview:', token?.substring(0, 10) + '...');
    
    
    if (!gameId || !token) {
       console.error("🌐 SERVICE DEBUG 5: Missing required parameters for starting end selection countdown:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      console.error("Missing required parameters for starting end selection countdown:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    console.log('🌐 SERVICE DEBUG 6: Making POST request to:', `${API_URL}/game/start-end-selection-countdown`);
    console.log('🌐 SERVICE DEBUG 7: Request body:', { gameId });
    console.log('🌐 SERVICE DEBUG 8: Request headers:', createHeaders(token));
    
    
    const response = await axios.post(
      `${API_URL}/game/start-end-selection-countdown`, 
      { gameId },
      createHeaders(token)
    );
    
    console.log('🌐 SERVICE DEBUG 9: Received response:', response.data);
    console.log('🌐 SERVICE DEBUG 10: Response status:', response.status);
    return response.data;
  } catch (error) {
  console.error('🌐 SERVICE DEBUG 11: Error in startEndSelectionCountdown:', error);
    console.error('🌐 SERVICE DEBUG 12: Error response data:', error.response?.data);
    console.error('🌐 SERVICE DEBUG 13: Error response status:', error.response?.status);
    console.error('🌐 SERVICE DEBUG 14: Error message:', error.message);
    
    return handleRequestError(error, 'starting end selection countdown');
  }
};

// Start countdown for ending voting
export const startEndVotingCountdown = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for starting end voting countdown:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/start-end-voting-countdown`, 
      { gameId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'starting end voting countdown');
  }
};

// Cancel countdown (for host)
export const cancelCountdown = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for canceling countdown:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    const response = await axios.post(
      `${API_URL}/game/cancel-countdown`, 
      { gameId },
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'canceling countdown');
  }
};