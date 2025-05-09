// client/src/services/musicService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

/**
 * Search for songs (Last.fm only)
 * @param {string} query The search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of song objects without YouTube data
 */
export const searchSongs = async (query, limit = 8) => {
  try {
    const numericLimit = typeof limit === 'number' ? limit : 8;
    
    const response = await axios.get(`${API_URL}/music/search`, {
      params: {
        query,
        limit: numericLimit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

/**
 * Add YouTube data to a track (called when user selects a song)
 * @param {Object} track The track object from search results
 * @returns {Promise<Object>} Track object with YouTube data
 */
export const addYoutubeDataToTrack = async (track) => {
  try {
    const response = await axios.post(`${API_URL}/music/track/youtube`, {
      track
    });
    return response.data;
  } catch (error) {
    console.error('Error adding YouTube data:', error);
    throw error;
  }
};

/**
 * Get song details by artist and track name
 * @param {string} artist The artist name
 * @param {string} track The track name
 * @returns {Promise<Object>} Song details with YouTube embed
 */
export const getSongDetails = async (artist, track) => {
  try {
    const response = await axios.get(`${API_URL}/music/track`, {
      params: {
        artist,
        track
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting song details:', error);
    throw error;
  }
};

/**
 * Get YouTube embed URL from song data
 * @param {Object} song Song object from API
 * @returns {string} URL for embedding YouTube video
 */
export const getYouTubeEmbedUrl = (song) => {
  if (!song || !song.youtubeId) return null;
  return `https://www.youtube.com/embed/${song.youtubeId}`;
};

/**
 * Get YouTube watch URL from song data
 * @param {Object} song Song object from API
 * @returns {string} URL for watching on YouTube
 */
export const getYouTubeWatchUrl = (song) => {
  if (!song || !song.youtubeId) return null;
  return `https://www.youtube.com/watch?v=${song.youtubeId}`;
};

/**
 * Format a song object properly for the game state
 * @param {Object} song Song from search results
 * @returns {Object} Formatted song for game submission
 */
export const formatSongForSubmission = (song) => {
  return {
    id: song.id,
    name: song.name,
    artist: song.artist,
    albumCover: song.albumArt,
    youtubeId: song.youtubeId
  };
};

// Default export
const musicService = {
  searchSongs,
  addYoutubeDataToTrack,
  getSongDetails,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  formatSongForSubmission
};

export default musicService;