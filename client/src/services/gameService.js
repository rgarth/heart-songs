// client/src/services/gameService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Create headers with auth token
const createHeaders = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Create a new game
export const createGame = async (userId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/create`, 
      { userId },
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Join an existing game
export const joinGame = async (gameCode, userId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/join`, 
      { gameCode, userId },
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// Toggle ready status
export const toggleReady = async (gameId, userId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/ready`, 
      { gameId, userId },
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error toggling ready status:', error);
    throw error;
  }
};

// Submit song selection
export const submitSong = async (gameId, userId, songData, token) => {
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
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting song:', error.response?.data || error.message);
    throw error;
  }
};

// Vote for a song
export const voteForSong = async (gameId, userId, submissionId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/vote`, 
      { gameId, userId, submissionId },
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error voting for song:', error);
    throw error;
  }
};

// Start a new round
export const startNewRound = async (gameId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/game/next-round`, 
      { gameId },
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error starting new round:', error);
    throw error;
  }
};

// Get game state
export const getGameState = async (gameId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/game/${gameId}`,
      createHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};