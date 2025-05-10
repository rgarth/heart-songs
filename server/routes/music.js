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

// Search for tracks (Last.fm only, no YouTube)
router.get('/search', async (req, res) => {
  try {
    console.log('=== MUSIC SEARCH DEBUG ===');
    console.log('Request query params:', req.query);
    
    const { query, limit = 8 } = req.query;
    
    if (!query) {
      console.log('ERROR: No query provided');
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log('Searching for:', query, 'with limit:', limit);
    console.log('API Keys check:');
    console.log('  - LASTFM_API_KEY exists:', !!process.env.LASTFM_API_KEY);
    
    const tracks = await musicService.searchSongs(query, limit);
    
    console.log('Search successful, returning', tracks.length, 'tracks');
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

// Get YouTube data for a specific track (called when user selects a song)
router.post('/track/youtube', async (req, res) => {
  try {
    console.log('=== ADD YOUTUBE DATA DEBUG ===');
    console.log('Request body:', req.body);
    
    const { track } = req.body;
    
    if (!track || !track.id || !track.name || !track.artist) {
      console.log('ERROR: Invalid track data');
      return res.status(400).json({ error: 'Valid track data is required' });
    }
    
    console.log('Adding YouTube data for:', track.name, 'by', track.artist);
    
    const trackWithYoutube = await musicService.addYoutubeDataToTrack(track);
    
    console.log('YouTube data added successfully');
    res.json(trackWithYoutube);
  } catch (error) {
    console.error('=== YOUTUBE ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==================');
    
    res.status(500).json({ 
      error: 'Failed to add YouTube data',
      details: error.message
    });
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