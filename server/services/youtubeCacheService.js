// server/services/youtubeCacheService.js - Optimized version
const YoutubeCache = require('../models/YoutubeCache');
const youtubeService = require('./youtubeService');

// In-memory cache for very recent lookups (prevents concurrent requests)
const recentLookups = new Map();
const RECENT_CACHE_TTL = 30000; // 30 seconds

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
    
    // Check in-memory recent cache first (prevents concurrent API calls)
    const recentLookup = recentLookups.get(cacheKey);
    if (recentLookup && Date.now() - recentLookup.timestamp < RECENT_CACHE_TTL) {
      console.log(`Using recent lookup for: ${artist} - ${track}`);
      return recentLookup.data;
    }
    
    // Try to find in database cache
    let cachedEntry = await YoutubeCache.findOne({ trackKey: cacheKey });
    
    if (cachedEntry) {
      // Only return cache entry if it has a valid YouTube ID (not 'NOT_FOUND')
      if (cachedEntry.youtubeId && cachedEntry.youtubeId !== 'NOT_FOUND') {
        // Update access info
        await cachedEntry.updateAccess();
        
        const result = {
          youtubeId: cachedEntry.youtubeId,
          youtubeTitle: cachedEntry.youtubeTitle,
          youtubeThumbnail: cachedEntry.youtubeThumbnail,
          confidence: cachedEntry.confidence,
          fromCache: true
        };
        
        // Store in recent cache
        recentLookups.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      } else {
        console.log('Found NOT_FOUND cache entry, will search YouTube again');
      }
    }
    
    // Check if we're already searching for this track
    if (recentLookups.has(cacheKey + '_searching')) {
      console.log(`Already searching for: ${artist} - ${track}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Try to get from cache again after waiting
      return getOrCacheYoutubeData(artist, track, lastfmId);
    }
    
    // Mark that we're searching for this track
    recentLookups.set(cacheKey + '_searching', true);
    
    try {
      console.log(`Searching YouTube API for: ${artist} - ${track}`);
      const videos = await youtubeService.searchVideos(`${artist} - ${track}`, 1);
      
      // Remove the searching flag
      recentLookups.delete(cacheKey + '_searching');
      
      if (videos.length === 0) {
        // No videos found - DON'T cache this negative result
        console.log(`No YouTube video found for: ${artist} - ${track}`);
        const result = null;
        
        // Store in recent cache to prevent immediate retries
        recentLookups.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      }
      
      const video = videos[0];
      
      // Cache the result only if a video was found
      let cacheEntry;
      try {
        cacheEntry = await YoutubeCache.create({
          trackKey: cacheKey,
          artist,
          track,
          lastfmId,
          youtubeId: video.id,
          youtubeTitle: video.title,
          youtubeThumbnail: video.thumbnail,
          confidence: calculateConfidence(artist, track, video.title)
        });
      } catch (createError) {
        if (createError.code === 11000) {
          // Duplicate key error - another process beat us to it
          // Let's fetch the existing entry instead
          cacheEntry = await YoutubeCache.findOne({ trackKey: cacheKey });
          await cacheEntry.updateAccess();
        } else {
          throw createError;
        }
      }
      
      const result = {
        youtubeId: cacheEntry.youtubeId,
        youtubeTitle: cacheEntry.youtubeTitle,
        youtubeThumbnail: cacheEntry.youtubeThumbnail,
        confidence: cacheEntry.confidence,
        fromCache: false
      };
      
      // Store in recent cache
      recentLookups.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
      
    } catch (youtubeError) {
      console.error('YouTube search error:', youtubeError);
      
      // Remove the searching flag on error
      recentLookups.delete(cacheKey + '_searching');
      
      // Check if it's a quota error
      if (youtubeError.message === 'Failed to search videos') {
        const result = {
          youtubeId: null,
          quotaExhausted: true,
          fromCache: false
        };
        
        // Store in recent cache with shorter TTL for quota errors
        recentLookups.set(cacheKey, {
          data: result,
          timestamp: Date.now() + (60000 * 5) // 5 minute TTL for quota errors
        });
        
        return result;
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
  
  try {
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
        lastfmId: options.lastfmId || null,
        lastAccessed: new Date(), // Update last accessed time
        $inc: { accessCount: 0 } // Initialize accessCount if it doesn't exist
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true // This ensures default values are set on new documents
      }
    );
    
    // Clear any recent cache for this key
    recentLookups.delete(cacheKey);
    
    return entry;
  } catch (error) {
    if (error.code === 11000) {
      // Even with findOneAndUpdate, there's a small chance of race condition
      // Let's try to find the existing entry
      const existingEntry = await YoutubeCache.findOne({ trackKey: cacheKey });
      if (existingEntry) {
        return existingEntry;
      }
    }
    
    // If it's still failing, log and rethrow
    console.error('Error in addToCacheManually:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  const totalEntries = await YoutubeCache.countDocuments();
  
  // Count valid entries (those with actual YouTube IDs)
  const entriesWithVideos = await YoutubeCache.countDocuments({ 
    youtubeId: { $ne: 'NOT_FOUND', $exists: true, $ne: null } 
  });
  
  // Count any NOT_FOUND entries (shouldn't be there but let's check)
  const notFoundEntries = await YoutubeCache.countDocuments({ 
    youtubeId: 'NOT_FOUND' 
  });
  
  const oldestEntry = await YoutubeCache.findOne()
    .sort({ firstSearched: 1 })
    .select('artist track firstSearched');
    
  const mostAccessed = await YoutubeCache.findOne()
    .sort({ accessCount: -1 })
    .select('artist track accessCount');
  
  // Get recent cache stats
  const recentCacheSize = recentLookups.size;
  
  return {
    totalEntries,
    entriesWithVideos,
    notFoundEntries, // This should be 0 with the new approach
    recentCacheEntries: recentCacheSize,
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
  
  // Remove all 'NOT_FOUND' entries (if any exist)
  const notFoundEntries = await YoutubeCache.deleteMany({
    youtubeId: 'NOT_FOUND'
  });
  
  deletedCount += notFoundEntries.deletedCount;
  console.log(`Removed ${notFoundEntries.deletedCount} NOT_FOUND entries`);
  
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
  
  // Clean up recent cache entries older than TTL
  const now = Date.now();
  for (const [key, value] of recentLookups.entries()) {
    if (now - value.timestamp > RECENT_CACHE_TTL) {
      recentLookups.delete(key);
    }
  }
  
  return deletedCount;
}

module.exports = {
  getOrCacheYoutubeData,
  addToCacheManually,
  getCacheStats,
  cleanupCache
};