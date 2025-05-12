// server/services/musicService.js - Updated with YouTube cache and proper preference passing
const lastfmService = require('./lastfmService');
const youtubeService = require('./youtubeService');
const youtubeCacheService = require('./youtubeCacheService');
const NodeCache = require('node-cache');

// Create a cache with default TTL of 1 hour for search results
const searchCache = new NodeCache({ stdTTL: 3600 });

/**
 * Search for songs (only Last.fm, no YouTube)
 * @param {string} query Search query
 * @param {number} limit Maximum number of results
 * @returns {Promise<Array>} Array of track objects without YouTube data
 */
async function searchSongs(query, limit = 8) {
  try {
    // Check cache first
    const cacheKey = `search:${query}:${limit}`;
    const cachedResults = searchCache.get(cacheKey);
    
    if (cachedResults) {
      return cachedResults;
    }
    
    // Get tracks from Last.fm only
    const tracks = await lastfmService.searchTracks(query, limit);
    
    // Return tracks without YouTube data
    const enhancedTracks = tracks.map(track => ({
      ...track,
      youtubeId: null,
      youtubeTitle: null,
      youtubeEmbed: null,
      youtubeWatch: null,
    }));
    
    searchCache.set(cacheKey, enhancedTracks);
    
    return enhancedTracks;
  } catch (error) {
    console.error('\n===== MUSIC SEARCH ERROR =====');
    console.error('Error:', error.message);
    console.error('============================\n');
    
    throw new Error(`Failed to search for songs: ${error.message}`);
  }
}

/**
 * Add YouTube data to a specific track using cache
 * @param {Object} track Track object from Last.fm
 * @param {boolean} preferVideo Whether to prefer video versions (default: false)
 * @returns {Promise<Object>} Track with YouTube data
 */
async function addYoutubeDataToTrack(track, preferVideo = false) {
  try {
    // Check if YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not set');
      return {
        ...track,
        youtubeId: null,
        youtubeEmbed: null,
        youtubeWatch: null,
        quotaExhausted: true
      };
    }
    
    try {
      // Get YouTube data from cache or fetch it
      const youtubeData = await youtubeCacheService.getOrCacheYoutubeData(
        track.artist, 
        track.name, 
        track.id,
        preferVideo // Pass the preference to the cache service
      );
      
      if (!youtubeData) {
        return {
          ...track,
          youtubeId: null,
          youtubeEmbed: null,
          youtubeWatch: null
        };
      }
      
      if (youtubeData.quotaExhausted) {
        return {
          ...track,
          youtubeId: null,
          youtubeEmbed: null,
          youtubeWatch: null,
          quotaExhausted: true
        };
      }
      
      const result = {
        ...track,
        youtubeId: youtubeData.youtubeId,
        youtubeTitle: youtubeData.youtubeTitle,
        youtubeEmbed: youtubeService.getEmbedUrl(youtubeData.youtubeId),
        youtubeWatch: youtubeService.getWatchUrl(youtubeData.youtubeId),
        youtubeConfidence: youtubeData.confidence,
        fromCache: youtubeData.fromCache,
        isVideo: youtubeData.isVideo,
        preferredType: youtubeData.preferredType
      };
      
      return result;
    } catch (error) {
      console.error('YouTube search error:', error.message);
      
      console.warn('YouTube fetch failed, returning track without video');
      return {
        ...track,
        youtubeId: null,
        youtubeEmbed: null,
        youtubeWatch: null,
        error: error.message
      };
    }
  } catch (error) {
    console.error('Error in addYoutubeDataToTrack:', error);
    return track;
  }
}

/**
 * Get track details by searching and finding the first match
 * @param {string} artist Artist name
 * @param {string} track Track name
 * @param {boolean} preferVideo Whether to prefer video versions (default: false)
 * @returns {Promise<Object>} Track details with YouTube data
 */
async function getTrackBySearch(artist, track, preferVideo = false) {
  try {
    // Check cache first
    const cacheKey = `track:${artist}:${track}:${preferVideo}`;
    const cachedTrack = searchCache.get(cacheKey);
    
    if (cachedTrack) {
      return cachedTrack;
    }
    
    // Search for the specific track
    const searchQuery = `${artist} ${track}`;
    const searchResults = await searchSongs(searchQuery, 5);
    
    // Try to find the exact match
    const exactMatch = searchResults.find(result => 
      result.artist.toLowerCase() === artist.toLowerCase() && 
      result.name.toLowerCase() === track.toLowerCase()
    );
    
    // Get the best match (exact match or first result)
    let bestMatch = exactMatch || (searchResults.length > 0 ? searchResults[0] : null);
    
    // Add YouTube data to the best match
    if (bestMatch) {
      bestMatch = await addYoutubeDataToTrack(bestMatch, preferVideo);
      searchCache.set(cacheKey, bestMatch);
    }
    
    return bestMatch;
  } catch (error) {
    console.error('Error getting track by search:', error);
    throw new Error('Failed to get track details');
  }
}

/**
 * Clear the cache for a specific query or track
 * @param {string} cacheKey The cache key to clear
 */
function clearCache(cacheKey) {
  searchCache.del(cacheKey);
}

/**
 * Get cache statistics including YouTube cache
 * @returns {Promise<Object>} Combined cache statistics
 */
async function getCacheStatistics() {
  const youtubeStats = await youtubeCacheService.getCacheStats();
  const memoryStats = searchCache.getStats();
  
  return {
    memory: {
      hits: memoryStats.hits,
      misses: memoryStats.misses,
      keys: memoryStats.keys,
      ksize: memoryStats.ksize,
      vsize: memoryStats.vsize
    },
    youtube: youtubeStats
  };
}

/**
 * Cleanup YouTube cache (for maintenance)
 * @param {Object} options Cleanup options
 * @returns {Promise<Object>} Cleanup results
 */
async function performMaintenance(options = {}) {
  const deletedCount = await youtubeCacheService.cleanupCache(options);
  const stats = await getCacheStatistics();
  
  return {
    deletedEntries: deletedCount,
    currentStats: stats
  };
}

module.exports = {
  searchSongs,
  addYoutubeDataToTrack,
  getTrackBySearch,
  clearCache,
  getCacheStatistics,
  performMaintenance
};