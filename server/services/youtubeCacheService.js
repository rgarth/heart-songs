// server/services/youtubeCacheService.js - Updated for dual preference storage
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
 * @param {boolean} preferVideo Whether to prefer video versions (default: false)
 * @returns {Promise<Object|null>} YouTube data or null if not found
 */
async function getOrCacheYoutubeData(artist, track, lastfmId = null, preferVideo = false) {
  try {
    // Generate cache key (no preference needed)
    const cacheKey = YoutubeCache.generateKey(artist, track);
    const recentCacheKey = `${cacheKey}_${preferVideo ? 'video' : 'audio'}`;
    
    // Check in-memory recent cache first
    const recentLookup = recentLookups.get(recentCacheKey);
    if (recentLookup && Date.now() - recentLookup.timestamp < RECENT_CACHE_TTL) {
      console.log(`Using recent lookup for: ${artist} - ${track} (${preferVideo ? 'video' : 'audio'})`);
      return recentLookup.data;
    }
    
    // Try to find in database cache
    let cachedEntry = await YoutubeCache.findOne({ trackKey: cacheKey });
    
    if (cachedEntry) {
      // Check if we have the requested preference
      const preferenceData = preferVideo ? cachedEntry.video : cachedEntry.audio;
      
      if (preferenceData && preferenceData.youtubeId && preferenceData.youtubeId !== 'NOT_FOUND') {
        // Update access info
        await cachedEntry.updateAccess(preferVideo);
        
        const result = {
          youtubeId: preferenceData.youtubeId,
          youtubeTitle: preferenceData.youtubeTitle,
          youtubeThumbnail: preferenceData.youtubeThumbnail,
          confidence: preferenceData.confidence,
          isVideo: preferVideo,
          preferredType: preferVideo ? 'video' : 'audio',
          fromCache: true
        };
        
        // Store in recent cache
        recentLookups.set(recentCacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        console.log(`[CACHE HIT] Found ${preferVideo ? 'video' : 'audio'} for: ${artist} - ${track}`);
        return result;
      }
      
      // We have a cache entry but not for this preference
      console.log(`[PARTIAL CACHE] Have ${preferVideo ? 'audio' : 'video'} but need ${preferVideo ? 'video' : 'audio'} for: ${artist} - ${track}`);
    }
    
    // If we didn't find the exact preference, check if we should hit the API
    console.log(`[CACHE MISS] No ${preferVideo ? 'video' : 'audio'} found for: ${artist} - ${track}, searching YouTube...`);
    
    // Check if we're already searching for this track with this preference
    const searchingKey = `${cacheKey}_${preferVideo ? 'video' : 'audio'}_searching`;
    if (recentLookups.has(searchingKey)) {
      console.log(`Already searching for: ${artist} - ${track} (${preferVideo ? 'video' : 'audio'}), waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Try to get from cache again after waiting
      return getOrCacheYoutubeData(artist, track, lastfmId, preferVideo);
    }
    
    // Mark that we're searching for this track with this preference
    recentLookups.set(searchingKey, true);
    
    try {
      console.log(`Searching YouTube API for: ${artist} - ${track} (${preferVideo ? 'video' : 'audio'})`);
      
      // Use the updated search function with preference
      const videos = await youtubeService.searchVideos(`${artist} - ${track}`, preferVideo, 1);
      
      // Remove the searching flag
      recentLookups.delete(searchingKey);
      
      if (videos.length === 0) {
        console.log(`No YouTube ${preferVideo ? 'video' : 'audio'} found for: ${artist} - ${track}`);
        const result = null;
        
        // Store in recent cache to prevent immediate retries
        recentLookups.set(recentCacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      }
      
      const video = videos[0];
      
      // Determine if this is a video or audio result
      const isVideo = isVideoContent(video.title);
      
      // Update or create cache entry
      let cacheEntry = cachedEntry;
      if (!cacheEntry) {
        // Create new cache entry
        cacheEntry = new YoutubeCache({
          trackKey: cacheKey,
          artist,
          track,
          lastfmId
        });
      }
      
      // Add the new preference data
      const preferenceData = {
        youtubeId: video.id,
        youtubeTitle: video.title,
        youtubeThumbnail: video.thumbnail,
        confidence: calculateConfidence(artist, track, video.title),
        firstSearched: new Date(),
        lastAccessed: new Date()
      };
      
      if (preferVideo) {
        cacheEntry.video = preferenceData;
      } else {
        cacheEntry.audio = preferenceData;
      }
      
      await cacheEntry.save();
      
      const result = {
        youtubeId: video.id,
        youtubeTitle: video.title,
        youtubeThumbnail: video.thumbnail,
        confidence: preferenceData.confidence,
        isVideo: isVideo,
        preferredType: preferVideo ? 'video' : 'audio',
        fromCache: false
      };
      
      // Store in recent cache
      recentLookups.set(recentCacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`[NEW CACHE ENTRY] Cached ${preferVideo ? 'video' : 'audio'} for: ${artist} - ${track}`);
      return result;
      
    } catch (youtubeError) {
      console.error('YouTube search error:', youtubeError);
      
      // Remove the searching flag on error
      recentLookups.delete(searchingKey);
      
      // Check if it's a quota error
      if (youtubeError.message === 'Failed to search videos') {
        const result = {
          youtubeId: null,
          quotaExhausted: true,
          fromCache: false
        };
        
        // Store in recent cache with shorter TTL for quota errors
        recentLookups.set(recentCacheKey, {
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
 * Determine if a YouTube result is primarily video content
 * @param {string} title YouTube video title
 * @returns {boolean} Whether it's likely video content
 */
function isVideoContent(title) {
  const titleLower = title.toLowerCase();
  
  // Strong indicators of music videos
  const videoIndicators = [
    'music video',
    'official video',
    'lyrics video', // Note: might still be mostly static
    'live performance',
    'concert',
    'behind the scenes'
  ];
  
  // Strong indicators of audio content
  const audioIndicators = [
    'official audio',
    'audio only',
    'topic', // YouTube's auto-generated topic channels
    'official',
    'full album'
  ];
  
  // Check for explicit audio indicators first
  if (audioIndicators.some(indicator => titleLower.includes(indicator))) {
    return false;
  }
  
  // Check for explicit video indicators
  if (videoIndicators.some(indicator => titleLower.includes(indicator))) {
    return true;
  }
  
  // Default to false (audio) if uncertain
  return false;
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
  if (normalizedTitle.includes('official')) score += 0.2;
  if (normalizedTitle.includes('audio')) score += 0.05;
  if (normalizedTitle.includes('music video')) score += 0.15;
  
  return Math.min(score, 1);
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  const totalEntries = await YoutubeCache.countDocuments();
  
  // Count entries with audio or video
  const entriesWithAudio = await YoutubeCache.countDocuments({ 
    'audio.youtubeId': { $exists: true, $ne: null, $ne: 'NOT_FOUND' }
  });
  
  const entriesWithVideo = await YoutubeCache.countDocuments({ 
    'video.youtubeId': { $exists: true, $ne: null, $ne: 'NOT_FOUND' }
  });
  
  // Count entries with both audio AND video
  const entriesWithBoth = await YoutubeCache.countDocuments({
    'audio.youtubeId': { $exists: true, $ne: null, $ne: 'NOT_FOUND' },
    'video.youtubeId': { $exists: true, $ne: null, $ne: 'NOT_FOUND' }
  });
  
  const oldestEntry = await YoutubeCache.findOne()
    .sort({ createdAt: 1 })
    .select('artist track createdAt');
    
  const mostAccessed = await YoutubeCache.findOne()
    .sort({ accessCount: -1 })
    .select('artist track accessCount');
  
  // Get recent cache stats
  const recentCacheSize = recentLookups.size;
  
  return {
    totalEntries,
    entriesWithAudio,
    entriesWithVideo,
    entriesWithBoth,
    audioOnlyEntries: entriesWithAudio - entriesWithBoth,
    videoOnlyEntries: entriesWithVideo - entriesWithBoth,
    recentCacheEntries: recentCacheSize,
    oldestEntry: oldestEntry ? {
      artist: oldestEntry.artist,
      track: oldestEntry.track,
      createdAt: oldestEntry.createdAt
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
  
  // Remove entries with no valid data
  const emptyEntries = await YoutubeCache.deleteMany({
    $and: [
      { $or: [
        { 'audio.youtubeId': { $exists: false } },
        { 'audio.youtubeId': null },
        { 'audio.youtubeId': 'NOT_FOUND' }
      ]},
      { $or: [
        { 'video.youtubeId': { $exists: false } },
        { 'video.youtubeId': null },
        { 'video.youtubeId': 'NOT_FOUND' }
      ]}
    ]
  });
  
  deletedCount += emptyEntries.deletedCount;
  
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
  getCacheStats,
  cleanupCache
};