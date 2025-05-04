// server/routes/spotify.js
const express = require('express');
const router = express.Router();
const { searchTracks, getTrack, saveTrackToPlaylist, getPlaylistTracks } = require('../services/spotifyService');

// Search for tracks using Spotify API (no auth required)
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const tracks = await searchTracks(query, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Get track details from Spotify API (no auth required)
router.get('/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    
    const track = await getTrack(trackId);
    res.json(track);
  } catch (error) {
    console.error('Error getting track:', error);
    res.status(500).json({ error: 'Failed to get track details' });
  }
});

// Save track to game playlist (stored in our database)
router.post('/playlist/add', async (req, res) => {
  try {
    const { gameId, trackId, trackName, artistName, albumCover } = req.body;
    
    if (!gameId || !trackId || !trackName || !artistName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const savedTrack = await saveTrackToPlaylist(
      gameId,
      trackId,
      trackName,
      artistName,
      albumCover || ''
    );
    
    res.json(savedTrack);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
});

// Get all tracks in a game's playlist
router.get('/playlist/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const tracks = await getPlaylistTracks(gameId);
    res.json(tracks);
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    res.status(500).json({ error: 'Failed to get playlist tracks' });
  }
});

module.exports = router;