// server/routes/music.js
const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');
const rateLimit = require('express-rate-limit');

// Apply rate limiting to protect API keys
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply the rate limiter to all music routes
router.use(apiLimiter);

// Search for tracks with YouTube videos
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 8 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const tracks = await musicService.searchSongs(query, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({ error: 'Failed to search songs' });
  }
});

// Get track details by artist and track name
router.get('/track', async (req, res) => {
  try {
    const { artist, track } = req.query;
    
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track name are required' });
    }
    
    const trackDetails = await musicService.getTrackBySearch(artist, track);
    
    if (!trackDetails) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(trackDetails);
  } catch (error) {
    console.error('Error getting track details:', error);
    res.status(500).json({ error: 'Failed to get track details' });
  }
});

// Clear search cache (for testing/debugging)
router.post('/clear-cache', async (req, res) => {
  try {
    const { cacheKey } = req.body;
    
    if (cacheKey) {
      musicService.clearCache(cacheKey);
      res.json({ message: `Cleared cache for key: ${cacheKey}` });
    } else {
      res.status(400).json({ error: 'Cache key is required' });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Make sure to export the router correctly
module.exports = router;