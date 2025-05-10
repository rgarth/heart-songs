// server/routes/cache.js
const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');
const youtubeCacheService = require('../services/youtubeCacheService');
const { authenticateUser } = require('../middleware/auth');

// Require authentication for cache management routes
router.use(authenticateUser);

// Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await musicService.getCacheStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

// Manual cache entry (for testing)
router.post('/add-entry', async (req, res) => {
  try {
    const { artist, track, youtubeId, options = {} } = req.body;
    
    if (!artist || !track || !youtubeId) {
      return res.status(400).json({ error: 'Artist, track, and youtubeId are required' });
    }
    
    const entry = await youtubeCacheService.addToCacheManually(artist, track, youtubeId, options);
    res.json(entry);
  } catch (error) {
    console.error('Error adding cache entry:', error);
    res.status(500).json({ error: 'Failed to add cache entry' });
  }
});

// Manual cache cleanup
router.post('/cleanup', async (req, res) => {
  try {
    const options = req.body || {};
    const result = await musicService.performMaintenance(options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error cleaning cache:', error);
    res.status(500).json({ error: 'Failed to clean cache' });
  }
});

// Get cache warmup suggestions
router.get('/warmup-suggestions', async (req, res) => {
  try {
    // This endpoint could suggest popular tracks to pre-cache
    // For now, returning a simple response
    res.json({
      message: 'Cache warmup not implemented yet',
      suggestion: 'Consider pre-caching popular tracks from Last.fm charts'
    });
  } catch (error) {
    console.error('Error getting warmup suggestions:', error);
    res.status(500).json({ error: 'Failed to get warmup suggestions' });
  }
});

// Search for a specific cache entry
router.get('/search', async (req, res) => {
  try {
    const { artist, track } = req.query;
    
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track are required' });
    }
    
    const YoutubeCache = require('../models/YoutubeCache');
    const cacheKey = YoutubeCache.generateKey(artist, track);
    const entry = await YoutubeCache.findOne({ trackKey: cacheKey });
    
    if (!entry) {
      return res.status(404).json({ error: 'Cache entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error searching cache:', error);
    res.status(500).json({ error: 'Failed to search cache' });
  }
});

// Get most frequently accessed entries
router.get('/top-accessed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const YoutubeCache = require('../models/YoutubeCache');
    
    const topEntries = await YoutubeCache.find()
      .sort({ accessCount: -1 })
      .limit(limit)
      .select('artist track youtubeId accessCount lastAccessed');
    
    res.json(topEntries);
  } catch (error) {
    console.error('Error getting top accessed entries:', error);
    res.status(500).json({ error: 'Failed to get top accessed entries' });
  }
});

module.exports = router;