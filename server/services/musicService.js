// server/services/musicService.js
const lastfmService = require('./lastfmService');
const youtubeService = require('./youtubeService');
const NodeCache = require('node-cache');

// Create a cache with default TTL of 1 hour
const searchCache = new NodeCache({ stdTTL: 3600 });

/**
 * Search for songs and find matching YouTube videos
 * @param {string} query Search query
 * @param {number} limit Maximum number of results
 * @returns {Promise<Array>} Array of track objects with YouTube data
 */
async function searchSongs(query, limit = 8) {
  try {
    // Check cache first
    const cacheKey = `search:${query}:${limit}`;
    const cachedResults = searchCache.get(cacheKey);
    
    if (cachedResults) {
      return cachedResults;
    }
    
    // Get tracks from Last.fm
    const tracks = await lastfmService.searchTracks(query, limit);
    
    // For each track, find a matching YouTube video
    const enhancedTracks = await Promise.all(
      tracks.map(async track => {
        try {
          // Search for YouTube videos matching this track
          const videos = await youtubeService.searchVideos(`${track.artist} - ${track.name}`, 1);
          
          // Attach the first video result to the track
          return {
            ...track,
            youtubeId: videos.length > 0 ? videos[0].id : null,
            youtubeTitle: videos.length > 0 ? videos[0].title : null,
            youtubeEmbed: videos.length > 0 ? youtubeService.getEmbedUrl(videos[0].id) : null,
            youtubeWatch: videos.length > 0 ? youtubeService.getWatchUrl(videos[0].id) : null,
          };
        } catch (error) {
          // Check if it's a quota error
          if (error.message === 'Failed to search videos') {
            console.warn(`YouTube quota exceeded. Returning track without video for ${track.name}`);
            // Return the track without YouTube data when quota is exhausted
            return {
              ...track,
              youtubeId: null,
              youtubeEmbed: null,
              youtubeWatch: null,
              quotaExhausted: true // Flag to indicate quota issue
            };
          }
          
          console.error(`Error finding YouTube video for track ${track.name}:`, error);
          // Return the track without YouTube data for other errors
          return {
            ...track,
            youtubeId: null,
            youtubeEmbed: null,
            youtubeWatch: null
          };
        }
      })
    );
    
    // Don't filter out tracks without YouTube videos when quota is exhausted
    // Instead, return all tracks and let the frontend handle the missing videos
    const result = enhancedTracks;
    
    // Cache the results
    searchCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error in combined search:', error);
    throw new Error('Failed to search for songs with videos');
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
    const bestMatch = exactMatch || (searchResults.length > 0 ? searchResults[0] : null);
    
    // Cache the result if found
    if (bestMatch) {
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
  getTrackBySearch,
  clearCache
};