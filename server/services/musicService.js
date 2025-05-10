// server/services/musicService.js
const lastfmService = require('./lastfmService');
const youtubeService = require('./youtubeService');
const NodeCache = require('node-cache');

// Create a cache with default TTL of 1 hour
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
 * Add YouTube data to a specific track
 * @param {Object} track Track object from Last.fm
 * @returns {Promise<Object>} Track with YouTube data
 */
async function addYoutubeDataToTrack(track) {
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
      // Search for YouTube videos matching this track
      const videos = await youtubeService.searchVideos(`${track.artist} - ${track.name}`, 1);
      
      const youtubeData = {
        youtubeId: videos.length > 0 ? videos[0].id : null,
        youtubeTitle: videos.length > 0 ? videos[0].title : null,
        youtubeEmbed: videos.length > 0 ? youtubeService.getEmbedUrl(videos[0].id) : null,
        youtubeWatch: videos.length > 0 ? youtubeService.getWatchUrl(videos[0].id) : null,
      };
      
      const result = { ...track, ...youtubeData };
      return result;
    } catch (error) {
      console.error('YouTube search error:', error.message);
      
      // Check if it's a quota error
      if (error.message === 'Failed to search videos') {
        console.warn('YouTube quota exhausted');
        return {
          ...track,
          youtubeId: null,
          youtubeEmbed: null,
          youtubeWatch: null,
          quotaExhausted: true
        };
      }
      
      console.warn('YouTube search failed, returning track without video');
      return {
        ...track,
        youtubeId: null,
        youtubeEmbed: null,
        youtubeWatch: null
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
 * @returns {Promise<Object>} Track details with YouTube data
 */
async function getTrackBySearch(artist, track) {
  try {
    // Check cache first
    const cacheKey = `track:${artist}:${track}`;
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
      bestMatch = await addYoutubeDataToTrack(bestMatch);
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

module.exports = {
  searchSongs,
  addYoutubeDataToTrack,
  getTrackBySearch,
  clearCache
};