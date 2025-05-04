// client/src/services/gameService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Create headers with session token
const createHeaders = (sessionToken) => {
  return {
    headers: {
      Authorization: `Bearer ${sessionToken}`
    }
  };
};

// Create a new game
export const createGame = async (userId, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/create`, 
      { userId },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Join an existing game
export const joinGame = async (gameCode, userId, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/join`, 
      { gameCode, userId },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// Toggle ready status
export const toggleReady = async (gameId, userId, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/ready`, 
      { gameId, userId },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling ready status:', error);
    throw error;
  }
};

// Force start game (host only)
export const startGame = async (gameId, userId, sessionToken, questionData = null) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/start`,
      { 
        gameId, 
        userId,
        questionText: questionData?.text,
        questionCategory: questionData?.category
      },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

// Submit song selection
export const submitSong = async (gameId, userId, songData, sessionToken) => {
  console.log('Submitting song for gameId:', gameId);
  try {
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
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting song:', error.response?.data || error.message);
    throw error;
  }
};

// Vote for a song
export const voteForSong = async (gameId, userId, submissionId, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/vote`, 
      { gameId, userId, submissionId },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error voting for song:', error);
    throw error;
  }
};

// Get random question preview
export const getRandomQuestion = async (gameId, sessionToken) => {
  try {
    const response = await axios.get(
      `${API_URL}/game/${gameId}/question-preview`,
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error getting question preview:', error);
    throw error;
  }
};

// Submit custom question
export const submitCustomQuestion = async (gameId, questionText, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/${gameId}/custom-question`,
      { questionText },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting custom question:', error);
    throw error;
  }
};

// Start a new round
export const startNewRound = async (gameId, questionData, sessionToken) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/next-round`, 
      { 
        gameId,
        questionText: questionData?.text,
        questionCategory: questionData?.category
      },
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error starting new round:', error);
    throw error;
  }
};

// Get game state
export const getGameState = async (gameId, sessionToken) => {
  try {
    const response = await axios.get(
      `${API_URL}/game/${gameId}`,
      createHeaders(sessionToken)
    );
    return response.data;
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};