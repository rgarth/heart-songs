// server/services/youtubeCacheService.js
const YoutubeCache = require('../models/YoutubeCache');
const youtubeService = require('./youtubeService');

/**
 * Get YouTube data from cache or fetch and cache it
 * @param {string} artist Artist name
 * @param {string} track Track name
 * @param {string} lastfmId Optional Last.fm track ID
 * @returns {Promise<Object|null>} YouTube data or null if not found
 */
async function getOrCacheYoutubeData(artist, track, lastfmId = null) {
  try {
    // Generate cache key
    const cacheKey = YoutubeCache.generateKey(artist, track);
    
    // Try to find in cache
    let cachedEntry = await YoutubeCache.findOne({ trackKey: cacheKey });
    
    if (cachedEntry) {
      // Update access info
      await cachedEntry.updateAccess();
      
      return {
        youtubeId: cachedEntry.youtubeId,
        youtubeTitle: cachedEntry.youtubeTitle,
        youtubeThumbnail: cachedEntry.youtubeThumbnail,
        confidence: cachedEntry.confidence,
        fromCache: true
      };
    }
    
    // Not in cache, search YouTube
    try {
      const videos = await youtubeService.searchVideos(`${artist} - ${track}`, 1);
      
      if (videos.length === 0) {
        // No videos found - cache this negative result with special marker
        await YoutubeCache.create({
          trackKey: cacheKey,
          artist,
          track,
          lastfmId,
          youtubeId: 'NOT_FOUND', // Special marker for "no video found"
          confidence: 0
        });
        
        return null;
      }
      
      const video = videos[0];
      
      // Cache the result
      const cacheEntry = await YoutubeCache.create({
        trackKey: cacheKey,
        artist,
        track,
        lastfmId,
        youtubeId: video.id,
        youtubeTitle: video.title,
        youtubeThumbnail: video.thumbnail,
        confidence: calculateConfidence(artist, track, video.title)
      });
      
      return {
        youtubeId: video.id,
        youtubeTitle: video.title,
        youtubeThumbnail: video.thumbnail,
        confidence: cacheEntry.confidence,
        fromCache: false
      };
      
    } catch (youtubeError) {
      console.error('YouTube search error:', youtubeError);
      
      // Check if it's a quota error
      if (youtubeError.message === 'Failed to search videos') {
        // Don't cache quota errors - they're temporary
        return {
          youtubeId: null,
          quotaExhausted: true,
          fromCache: false
        };
      }
      
      // For other errors, return null without caching
      return null;
    }
    
  } catch (error) {
    console.error('Error in YouTube cache service:', error);
    return null;
  }
}

/**
 * Calculate a confidence score for a YouTube match
 * @param {string} artist Original artist
 * @param {string} track Original track
 * @param {string} youtubeTitle YouTube video title
 * @returns {number} Confidence score between 0 and 1
 */
function calculateConfidence(artist, track, youtubeTitle) {
  const normalizedTitle = youtubeTitle.toLowerCase();
  const normalizedArtist = artist.toLowerCase();
  const normalizedTrack = track.toLowerCase();
  
  let score = 0;
  
  // Check if artist is in the title
  if (normalizedTitle.includes(normalizedArtist)) {
    score += 0.3;
  }
  
  // Check if track is in the title
  if (normalizedTitle.includes(normalizedTrack)) {
    score += 0.4;
  }
  
  // Check for common patterns
  if (normalizedTitle.includes('official')) score += 0.1;
  if (normalizedTitle.includes('music video')) score += 0.1;
  if (normalizedTitle.includes('audio')) score += 0.05;
  if (normalizedTitle.includes('lyrics')) score += 0.05;
  
  return Math.min(score, 1);
}

/**
 * Manually add an entry to the cache
 * @param {string} artist Artist name
 * @param {string} track Track name
 * @param {string} youtubeId YouTube video ID
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Created cache entry
 */
async function addToCacheManually(artist, track, youtubeId, options = {}) {
  const cacheKey = YoutubeCache.generateKey(artist, track);
  
  const entry = await YoutubeCache.findOneAndUpdate(
    { trackKey: cacheKey },
    {
      trackKey: cacheKey,
      artist,
      track,
      youtubeId,
      youtubeTitle: options.title || null,
      youtubeThumbnail: options.thumbnail || null,
      confidence: options.confidence || 1,
      lastfmId: options.lastfmId || null
    },
    { upsert: true, new: true }
  );
  
  return entry;
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  const totalEntries = await YoutubeCache.countDocuments();
  const entriesWithVideos = await YoutubeCache.countDocuments({ 
    youtubeId: { $ne: 'NOT_FOUND' } 
  });
  const oldestEntry = await YoutubeCache.findOne().sort({ firstSearched: 1 });
  const mostAccessed = await YoutubeCache.findOne().sort({ accessCount: -1 });
  
  return {
    totalEntries,
    entriesWithVideos,
    entriesWithoutVideos: totalEntries - entriesWithVideos,
    oldestEntry: oldestEntry ? {
      artist: oldestEntry.artist,
      track: oldestEntry.track,
      firstSearched: oldestEntry.firstSearched
    } : null,
    mostAccessed: mostAccessed ? {
      artist: mostAccessed.artist,
      track: mostAccessed.track,
      accessCount: mostAccessed.accessCount
    } : null
  };
}

/**
 * Clean up old cache entries (manual cleanup)
 * @param {Object} options Cleanup options
 * @returns {Promise<number>} Number of deleted entries
 */
async function cleanupCache(options = {}) {
  const {
    olderThan = 90, // days
    maxEntries = 10000,
    minConfidence = 0
  } = options;
  
  let deletedCount = 0;
  
  // Remove entries older than X days
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - olderThan);
  
  const oldEntries = await YoutubeCache.deleteMany({
    lastAccessed: { $lt: oldDate }
  });
  
  deletedCount += oldEntries.deletedCount;
  
  // If still over maxEntries, remove least accessed
  const currentCount = await YoutubeCache.countDocuments();
  
  if (currentCount > maxEntries) {
    const excess = currentCount - maxEntries;
    const leastAccessed = await YoutubeCache.find()
      .sort({ accessCount: 1, lastAccessed: 1 })
      .limit(excess);
    
    const idsToDelete = leastAccessed.map(entry => entry._id);
    const deletedExcess = await YoutubeCache.deleteMany({
      _id: { $in: idsToDelete }
    });
    
    deletedCount += deletedExcess.deletedCount;
  }
  
  // Remove entries with very low confidence
  const lowConfidence = await YoutubeCache.deleteMany({
    confidence: { $lt: minConfidence }
  });
  
  deletedCount += lowConfidence.deletedCount;
  
  return deletedCount;
}

module.exports = {
  getOrCacheYoutubeData,
  addToCacheManually,
  getCacheStats,
  cleanupCache
};