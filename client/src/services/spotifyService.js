// client/src/services/spotifyService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';
const SPOTIFY_API = 'https://api.spotify.com/v1';

// Search for tracks
export const searchTracks = async (query, token) => {
  try {
    const response = await axios.get(`${SPOTIFY_API}/search`, {
      params: {
        q: query,
        type: 'track',
        limit: 10
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

// Get track details
export const getTrack = async (trackId, token) => {
  try {
    const response = await axios.get(`${SPOTIFY_API}/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting track details:', error);
    throw error;
  }
};

// Get playlist
export const getPlaylist = async (playlistId, token) => {
  try {
    const response = await axios.get(`${SPOTIFY_API}/playlists/${playlistId}`, {
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

// Play a track using Spotify Web Playback SDK
export const playTrack = async (deviceId, trackUri, token) => {
  try {
    console.log(`Playing track ${trackUri} on device ${deviceId}`);
    
    await axios.put(
      `${SPOTIFY_API}/me/player/play?device_id=${deviceId}`,
      { uris: [trackUri] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Play request successful');
    return true;
  } catch (error) {
    console.error('Error playing track:', error.response?.data || error.message);
    throw error;
  }
};

// Pause playback
export const pausePlayback = async (token) => {
  try {
    await axios.put(
      `${SPOTIFY_API}/me/player/pause`,
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

// Get playback state
export const getPlaybackState = async (token) => {
  try {
    const response = await axios.get(
      `${SPOTIFY_API}/me/player`,
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

// Get user profile information
export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(
      `${SPOTIFY_API}/me`,
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

// Check if user has premium
export const checkUserPremium = async (token) => {
  try {
    const profile = await getUserProfile(token);
    return profile.product === 'premium';
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false; // Default to non-premium on error
  }
};

// Transfer playback to specified device
export const transferPlayback = async (deviceId, token) => {
  try {
    await axios.put(
      `${SPOTIFY_API}/me/player`,
      {
        device_ids: [deviceId],
        play: false
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error transferring playback:', error);
    throw error;
  }
};

// Set playback volume
export const setPlaybackVolume = async (volumePercent, token) => {
  try {
    await axios.put(
      `${SPOTIFY_API}/me/player/volume`,
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

export default {
  searchTracks,
  getTrack,
  getPlaylist,
  playTrack,
  pausePlayback,
  getPlaybackState,
  getUserProfile,
  checkUserPremium,
  transferPlayback,
  setPlaybackVolume
};