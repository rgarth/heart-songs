// server/services/spotifyService.js
const axios = require('axios');

// Create a playlist for the game
async function createPlaylist(accessToken, name, description) {
  try {
    // Get current user's info to get their user ID
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const userId = userResponse.data.id;
    
    // Create a playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name,
        description,
        public: false,
        collaborative: true
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return playlistResponse.data;
  } catch (error) {
    console.error('Error creating playlist:', error.response?.data || error.message);
    throw new Error('Failed to create playlist');
  }
}

// Add a track to a playlist
async function addTrackToPlaylist(accessToken, playlistId, trackId) {
  try {
    const response = await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: [`spotify:track:${trackId}`]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error adding track to playlist:', error.response?.data || error.message);
    throw new Error('Failed to add track to playlist');
  }
}

// Search for tracks
async function searchTracks(accessToken, query, limit = 10) {
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error.response?.data || error.message);
    throw new Error('Failed to search tracks');
  }
}

// Get track details
async function getTrack(accessToken, trackId) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting track:', error.response?.data || error.message);
    throw new Error('Failed to get track details');
  }
}

module.exports = {
  createPlaylist,
  addTrackToPlaylist,
  searchTracks,
  getTrack
};