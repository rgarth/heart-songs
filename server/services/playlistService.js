// server/services/playlistService.js
const Playlist = require('../models/Playlist');
const Game = require('../models/Game');

/**
 * Save a song to the game's internal playlist
 * @param {string} gameId Game ID 
 * @param {string} trackId Track ID (can be Last.fm or internal ID)
 * @param {string} trackName Track name
 * @param {string} artistName Artist name
 * @param {string} albumCover Album cover URL
 * @param {string} youtubeId YouTube video ID
 * @returns {Promise<Object>} Saved playlist track
 */
async function saveTrackToPlaylist(gameId, trackId, trackName, artistName, albumCover, youtubeId) {
  try {
    let playlist = await Playlist.findOne({ gameId });
    
    if (!playlist) {
      // Create new playlist for this game
      const newPlaylist = new Playlist({
        gameId,
        tracks: [{
          trackId,
          trackName,
          artistName,
          albumCover,
          youtubeId
        }]
      });
      
      await newPlaylist.save();
      return newPlaylist.tracks[0];
    }
    
    // Try to find the game to get current round info
    let game = null;
    let roundNumber = null;
    let questionText = null;
    
    try {
      // First try to find by _id if it looks like a valid ObjectId
      if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
        game = await Game.findById(gameId);
      }
      
      // If not found, try by code
      if (!game) {
        game = await Game.findOne({ code: gameId });
      }
      
      // If game found, get round info
      if (game) {
        roundNumber = (game.previousRounds?.length || 0) + 1;
        questionText = game.currentQuestion?.text;
      }
    } catch (gameError) {
      console.error('Error fetching game for playlist round info:', gameError);
    }
    
    // Add track to existing playlist
    playlist.tracks.push({
      trackId,
      trackName,
      artistName,
      albumCover,
      youtubeId,
      roundNumber,
      questionText
    });
    
    await playlist.save();
    return playlist.tracks[playlist.tracks.length - 1];
  } catch (error) {
    console.error('Error saving track to playlist:', error);
    throw new Error('Failed to save track to playlist');
  }
}

/**
 * Get all tracks in a game's playlist
 * @param {string} gameId Game ID
 * @returns {Promise<Array>} Array of track objects
 */
async function getPlaylistTracks(gameId) {
  try {
    const playlist = await Playlist.findOne({ gameId });
    
    if (!playlist) {
      return [];
    }
    
    return playlist.tracks.map(track => ({
      trackId: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      albumCover: track.albumCover,
      youtubeId: track.youtubeId,
      roundNumber: track.roundNumber,
      questionText: track.questionText,
      addedAt: track.addedAt
    }));
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    return []; // Return empty array on error
  }
}

module.exports = {
  saveTrackToPlaylist,
  getPlaylistTracks
};