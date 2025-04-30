// server/routes/spotify.js
const express = require('express');
const router = express.Router();
const { searchTracks, getTrack } = require('../services/spotifyService');
const User = require('../models/User');

// Search for tracks
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    const token = req.headers.authorization.split(' ')[1];
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const tracks = await searchTracks(token, query, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Get track details
router.get('/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const token = req.headers.authorization.split(' ')[1];
    
    const track = await getTrack(token, trackId);
    res.json(track);
  } catch (error) {
    console.error('Error getting track:', error);
    res.status(500).json({ error: 'Failed to get track details' });
  }
});

module.exports = router;