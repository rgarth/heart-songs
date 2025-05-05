// client/src/services/spotifyService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

/**
 * Search for tracks using the server as a proxy to Spotify API
 * @param {string} query The search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of track objects
 */
export const searchTracks = async (query, limit = 10) => {
  try {
    // FIXED: Make sure limit is a number, not the access token
    // The token should not be passed here at all
    const numericLimit = typeof limit === 'number' ? limit : 10;
    
    const response = await axios.get(`${API_URL}/spotify/search`, {
      params: {
        query,
        limit: numericLimit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

/**
 * Get track details using the server as a proxy to Spotify API
 * @param {string} trackId The Spotify track ID
 * @returns {Promise<Object>} Track details
 */
export const getTrack = async (trackId) => {
  try {
    const response = await axios.get(`${API_URL}/spotify/track/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting track details:', error);
    throw error;
  }
};

/**
 * Get playlist details
 * @param {string} playlistId Playlist ID
 * @param {string} token Access token
 * @returns {Promise<Object>} Playlist details
 */
export const getPlaylist = async (playlistId, token) => {
  try {
    const response = await axios.get(`${API_URL}/spotify/playlist/${playlistId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting playlist:', error);
    throw error;
  }
};

/**
 * Play a track using Spotify Web Playback SDK
 * @param {string} deviceId Device ID
 * @param {string} trackUri Track URI
 * @param {string} token Access token
 * @returns {Promise<boolean>} Success status
 */
export const playTrack = async (deviceId, trackUri, token) => {
  try {
    await axios.put(
      `${API_URL}/spotify/play`,
      { 
        device_id: deviceId,
        track_uri: trackUri
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error playing track:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Pause playback
 * @param {string} token Access token
 * @returns {Promise<boolean>} Success status
 */
export const pausePlayback = async (token) => {
  try {
    await axios.put(
      `${API_URL}/spotify/pause`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error pausing playback:', error);
    throw error;
  }
};

/**
 * Get playback state
 * @param {string} token Access token
 * @returns {Promise<Object>} Playback state
 */
export const getPlaybackState = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/spotify/player`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting playback state:', error);
    throw error;
  }
};

/**
 * Get user profile information
 * @param {string} token Access token
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/spotify/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Check if user has premium
 * @param {string} token Access token
 * @returns {Promise<boolean>} Premium status
 */
export const checkUserPremium = async (token) => {
  try {
    const profile = await getUserProfile(token);
    return profile.product === 'premium';
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false; // Default to non-premium on error
  }
};

/**
 * Transfer playback to specified device
 * @param {string} deviceId Device ID
 * @param {string} token Access token
 * @returns {Promise<boolean>} Success status
 */
export const transferPlayback = async (deviceId, token) => {
  try {
    await axios.put(
      `${API_URL}/spotify/transfer`,
      {
        device_ids: [deviceId],
        play: false
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error transferring playback:', error);
    throw error;
  }
};

/**
 * Set playback volume
 * @param {number} volumePercent Volume percentage (0-100)
 * @param {string} token Access token
 * @returns {Promise<boolean>} Success status
 */
export const setPlaybackVolume = async (volumePercent, token) => {
  try {
    await axios.put(
      `${API_URL}/spotify/volume`,
      null,
      {
        params: {
          volume_percent: volumePercent
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error setting volume:', error);
    throw error;
  }
};

/**
 * Generate a Spotify open URL for the given track ID
 * @param {string} trackId The Spotify track ID
 * @returns {string} URL that will open in Spotify app or web player
 */
export const getSpotifyOpenURL = (trackId) => {
  return `https://open.spotify.com/track/${trackId}`;
};

// Default export
const spotifyService = {
  searchTracks,
  getTrack,
  getPlaylist,
  playTrack,
  pausePlayback,
  getPlaybackState,
  getUserProfile,
  checkUserPremium,
  transferPlayback,
  setPlaybackVolume,
  getSpotifyOpenURL
};

export default spotifyService;