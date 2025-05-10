// server/services/musicService.js
const lastfmService = require('./lastfmService');
const youtubeService = require('./youtubeService');
const NodeCache = require('node-cache');

// Create a cache with default TTL of 1 hour
const searchCache = new NodeCache({ stdTTL: 3600 });

/**
 * Search for songs (only Last.fm, no YouTube)
 * YouTube data will be fetched when a song is selected
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
    
    // Cache the results
    searchCache.set(cacheKey, enhancedTracks);
    
    return enhancedTracks;
  } catch (error) {
    console.error('Error in search:', error);
    throw new Error('Failed to search for songs');
  }
}

/**
 * Add YouTube data to a specific track
 * Call this when a user selects a song
 * @param {Object} track Track object from Last.fm
 * @returns {Promise<Object>} Track with YouTube data
 */
async function addYoutubeDataToTrack(track) {
  try {
    // Check cache first
    const cacheKey = `youtube:${track.id}`;
    const cachedData = searchCache.get(cacheKey);
    
    if (cachedData) {
      return { ...track, ...cachedData };
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
      
      // Cache the YouTube data
      searchCache.set(cacheKey, youtubeData);
      
      return { ...track, ...youtubeData };
    } catch (error) {
      // Check if it's a quota error
      if (error.message === 'Failed to search videos') {
        console.warn(`YouTube quota may be exhausted. Returning track without video for ${track.name}`);
        return {
          ...track,
          youtubeId: null,
          youtubeEmbed: null,
          youtubeWatch: null,
          quotaExhausted: true
        };
      }
      
      console.error(`Error finding YouTube video for track ${track.name}:`, error);
      return {
        ...track,
        youtubeId: null,
        youtubeEmbed: null,
        youtubeWatch: null
      };
    }
  } catch (error) {
    console.error('Error adding YouTube data:', error);
    return track; // Return original track if there's an error
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