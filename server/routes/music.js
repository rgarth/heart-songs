// server/routes/music.js - Updated to properly handle audio/video preference
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

// Search for tracks (Last.fm only, no YouTube)
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 8 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const tracks = await musicService.searchSongs(query, limit);
    
    res.json(tracks);
  } catch (error) {
    console.error('=== SEARCH ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==================');
    
    res.status(500).json({ 
      error: 'Failed to search songs',
      details: error.message,
      debugInfo: {
        lastfmApiKeySet: !!process.env.LASTFM_API_KEY,
        youtubeApiKeySet: !!process.env.YOUTUBE_API_KEY
      }
    });
  }
});

// Get YouTube data for a specific track (with audio/video preference)
router.post('/track/youtube', async (req, res) => {
  try {
    const { track, preferVideo = false } = req.body; // Accept preferVideo parameter
    
    if (!track || !track.id || !track.name || !track.artist) {
      return res.status(400).json({ error: 'Valid track data is required' });
    }
    
    const trackWithYoutube = await musicService.addYoutubeDataToTrack(track, preferVideo);
    res.json(trackWithYoutube);
  } catch (error) {
    console.error('Error adding YouTube data:', error);
    res.status(500).json({ 
      error: 'Failed to add YouTube data',
      details: error.message
    });
  }
});

// Get track details by artist and track name (with audio/video preference)
router.get('/track', async (req, res) => {
  try {
    const { artist, track, preferVideo = false } = req.query; // Accept preferVideo parameter
    
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track name are required' });
    }
    
    // Convert preferVideo string to boolean
    const preferVideoBoolean = preferVideo === 'true' || preferVideo === true;
     
    const trackDetails = await musicService.getTrackBySearch(artist, track, preferVideoBoolean);
    
    if (!trackDetails) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(trackDetails);
  } catch (error) {
    console.error('Error getting track details:', error);
    res.status(500).json({ 
      error: 'Failed to get track details',
      details: error.message
    });
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

module.exports = router;