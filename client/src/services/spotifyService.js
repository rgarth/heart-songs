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
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};