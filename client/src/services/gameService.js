// client/src/services/gameService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Create headers with auth token
const createHeaders = (token) => {
  if (!token) {
    console.error("No access token provided to createHeaders");
    throw new Error("Authentication token is required");
  }
  
  // Only log a preview of the token for security
  console.log(`Creating headers with token preview: ${token.substring(0, 10)}...`);
  
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Error handler to standardize error logging and handling
const handleRequestError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
    
    // Check if the error is due to authentication
    if (error.response.status === 401) {
      console.error('Authentication error. Token may be expired or invalid.');
    }
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
    
    console.log(`Creating game for user: ${userId} with token preview: ${token.substring(0, 10)}...`);
    
    const response = await axios.post(
      `${API_URL}/game/create`, 
      { userId },
      createHeaders(token)
    );
    
    console.log('Game created successfully:', response.data);
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
    
    console.log(`Joining game with code: ${gameCode} for user: ${userId}`);
    const response = await axios.post(
      `${API_URL}/game/join`, 
      { gameCode, userId },
      createHeaders(token)
    );
    
    console.log('Successfully joined game:', response.data);
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
    
    console.log(`Toggling ready status for game: ${gameId}, user: ${userId}`);
    const response = await axios.post(
      `${API_URL}/game/ready`, 
      { gameId, userId },
      createHeaders(token)
    );
    
    console.log('Ready status toggled successfully');
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
    
    console.log(`Starting game: ${gameId} by host: ${userId}`);
    const payload = { 
      gameId, 
      userId 
    };
    
    // Add question data if provided
    if (questionData) {
      payload.questionText = questionData.text;
      payload.questionCategory = questionData.category;
      console.log('Using custom question:', questionData.text);
    }
    
    const response = await axios.post(
      `${API_URL}/game/start`,
      payload,
      createHeaders(token)
    );
    
    console.log('Game started successfully');
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'starting game');
  }
};

// Submit song selection
export const submitSong = async (gameId, userId, songData, token) => {
  try {
    if (!gameId || !userId || !songData || !token) {
      console.error("Missing required parameters for submitting song:", { 
        hasGameId: !!gameId, 
        hasUserId: !!userId, 
        hasSongData: !!songData, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters for submitting song');
    }
    
    console.log(`Submitting song for game: ${gameId}, user: ${userId}, song: ${songData.name}`);
    const response = await axios.post(
      `${API_URL}/game/submit`, 
      { 
        gameId, 
        userId, 
        songId: songData.id,
        songName: songData.name,
        artist: songData.artists[0].name,
        albumCover: songData.album.images[0]?.url || ''
      },
      createHeaders(token)
    );
    
    console.log('Song submitted successfully');
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
    
    console.log(`Voting for submission: ${submissionId} in game: ${gameId} by user: ${userId}`);
    const response = await axios.post(
      `${API_URL}/game/vote`, 
      { gameId, userId, submissionId },
      createHeaders(token)
    );
    
    console.log('Vote submitted successfully');
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
    
    console.log(`Getting question preview for game: ${gameId}`);
    console.log("Request headers:", createHeaders(token));
    
    const response = await axios.get(
      `${API_URL}/game/${gameId}/question-preview`,
      createHeaders(token)
    );
    
    console.log('Question retrieved successfully:', response.data);
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
    
    console.log(`Submitting custom question for game: ${gameId}: "${questionText}"`);
    const response = await axios.post(
      `${API_URL}/game/${gameId}/custom-question`,
      { questionText },
      createHeaders(token)
    );
    
    console.log('Custom question submitted successfully');
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
    
    console.log(`Starting new round for game: ${gameId}`);
    const payload = { gameId };
    
    // Add question data if provided
    if (questionData) {
      payload.questionText = questionData.text;
      payload.questionCategory = questionData.category;
      console.log('Using custom question for new round:', questionData.text);
    }
    
    const response = await axios.post(
      `${API_URL}/game/next-round`, 
      payload,
      createHeaders(token)
    );
    
    console.log('New round started successfully');
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'starting new round');
  }
};

// Get game state
export const getGameState = async (gameId, token) => {
  try {
    if (!gameId || !token) {
      console.error("Missing required parameters for getting game state:", { 
        hasGameId: !!gameId, 
        hasToken: !!token 
      });
      throw new Error('Missing required parameters: gameId and token are required');
    }
    
    // Don't log every poll to avoid console spam
    const response = await axios.get(
      `${API_URL}/game/${gameId}`,
      createHeaders(token)
    );
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'getting game state');
  }
};