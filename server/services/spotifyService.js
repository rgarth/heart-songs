// server/services/spotifyService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Spotify API credentials (for server-to-server auth only)
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// In-memory token cache
let accessToken = null;
let tokenExpiry = null;

/**
 * Get a client credentials token for server-to-server API requests
 * @returns {Promise<string>} Access token
 */
async function getClientCredentialsToken() {
  // Check if we have a valid cached token
  const now = Date.now();
  if (accessToken && tokenExpiry && now < tokenExpiry) {
    return accessToken;
  }
  
  try {
    // Create basic auth with client ID and client secret
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    // Create form data with grant_type=client_credentials
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    
    accessToken = response.data.access_token;
    // Set expiry time (subtract 60 seconds for safety margin)
    tokenExpiry = now + (response.data.expires_in - 60) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('Failed to get Spotify access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify API');
  }
}

/**
 * Search for tracks using Spotify API
 * @param {string} query Search query
 * @param {number} limit Maximum number of results
 * @returns {Promise<Array>} Array of track objects
 */
async function searchTracks(query, limit = 10) {
  try {
    // Always ensure limit is a number
    const numericLimit = parseInt(limit);
    const validLimit = isNaN(numericLimit) ? 10 : Math.min(Math.max(1, numericLimit), 50);
    
    const token = await getClientCredentialsToken();
    
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: validLimit
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error.response?.data || error.message);
    throw new Error('Failed to search tracks');
  }
}

/**
 * Get track details from Spotify API
 * @param {string} trackId Spotify track ID
 * @returns {Promise<Object>} Track details
 */
async function getTrack(trackId) {
  try {
    const token = await getClientCredentialsToken();
    
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting track:', error.response?.data || error.message);
    throw new Error('Failed to get track details');
  }
}

/**
 * Save a song to the local server "playlist" (database)
 * @param {string} gameId Game ID 
 * @param {string} trackId Spotify track ID
 * @param {string} trackName Track name
 * @param {string} artistName Artist name
 * @param {string} albumCover Album cover URL
 * @returns {Promise<Object>} Saved playlist track
 */
async function saveTrackToPlaylist(gameId, trackId, trackName, artistName, albumCover) {
  // This function would save to your local database instead of Spotify
  // Implement with your Playlist model (see below for sample implementation)
  try {
    const Playlist = require('../models/Playlist');
    
    let playlist = await Playlist.findOne({ gameId });
    
    if (!playlist) {
      // Create new playlist for this game
      const newPlaylist = new Playlist({
        gameId,
        tracks: [{
          trackId,
          trackName,
          artistName,
          albumCover
        }]
      });
      
      await newPlaylist.save();
      return newPlaylist.tracks[0];
    }
    
    // Add track to existing playlist
    playlist.tracks.push({
      trackId,
      trackName,
      artistName,
      albumCover
    });
    
    await playlist.save();
    return playlist.tracks[playlist.tracks.length - 1];
  } catch (error) {
    console.error('Error saving track to playlist:', error);
    throw new Error('Failed to save track to playlist');
  }
}

/**
 * Get winning tracks from each round of a game (not all submitted tracks)
 * @param {string} gameId Game ID
 * @returns {Promise<Array>} Array of winning track objects
 */
async function getPlaylistTracks(gameId) {
  try {
    // First get the game to find the winning submissions from each round
    const Game = require('../models/Game');
    
    // Get game with populated previousRounds data
    let game = await Game.findById(gameId);
    if (!game) {
      game = await Game.findOne({ code: gameId });
    }
    
    if (!game) {
      console.log(`Game not found with ID: ${gameId}`);
      return [];
    }
    
    // Initialize array for winning tracks
    const winningTracks = [];
    
    // Check for previous rounds data
    if (game.previousRounds && Array.isArray(game.previousRounds) && game.previousRounds.length > 0) {
      console.log(`Found ${game.previousRounds.length} previous rounds`);
      
      // Extract winning songs from each round
      for (let i = 0; i < game.previousRounds.length; i++) {
        const round = game.previousRounds[i];
        
        if (round && round.submissions && Array.isArray(round.submissions) && round.submissions.length > 0) {
          // Find song with most votes in this round
          const sortedSubmissions = [...round.submissions].sort((a, b) => {
            const votesA = a.votes ? a.votes.length : 0;
            const votesB = b.votes ? b.votes.length : 0;
            return votesB - votesA;
          });
          
          const winner = sortedSubmissions[0];
          
          if (winner) {
            winningTracks.push({
              trackId: winner.songId,
              trackName: winner.songName,
              artistName: winner.artist,
              albumCover: winner.albumCover,
              question: round.question || null,
              roundNumber: i + 1
            });
            console.log(`Added winning track from round ${i+1}: ${winner.songName}`);
          }
        }
      }
    } else {
      console.log('No previous rounds data available');
    }
    
    // Add current round winner if the game is in 'results' or 'ended' status
    if ((game.status === 'results' || game.status === 'ended') && 
        game.submissions && Array.isArray(game.submissions) && game.submissions.length > 0) {
      
      // Find the song with most votes in current round
      const sortedSubmissions = [...game.submissions].sort((a, b) => {
        const votesA = a.votes ? a.votes.length : 0;
        const votesB = b.votes ? b.votes.length : 0;
        return votesB - votesA;
      });
      
      const currentWinner = sortedSubmissions[0];
      
      if (currentWinner) {
        // Check if this is a duplicate of any song already in the list
        const isDuplicate = winningTracks.some(track => track.trackId === currentWinner.songId);
        
        if (!isDuplicate) {
          winningTracks.push({
            trackId: currentWinner.songId,
            trackName: currentWinner.songName,
            artistName: currentWinner.artist,
            albumCover: currentWinner.albumCover,
            question: game.currentQuestion || null,
            roundNumber: winningTracks.length + 1
          });
          console.log(`Added current round winner: ${currentWinner.songName}`);
        } else {
          console.log(`Current winner is a duplicate, not adding: ${currentWinner.songName}`);
        }
      }
    }
    
    console.log(`Returning ${winningTracks.length} winning tracks`);
    return winningTracks;
  } catch (error) {
    console.error('Error getting winning tracks:', error);
    return [];
  }
}

module.exports = {
  searchTracks,
  getTrack,
  saveTrackToPlaylist,
  getPlaylistTracks
};