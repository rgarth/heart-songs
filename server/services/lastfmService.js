// server/services/lastfmService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Last.fm API credentials
const API_KEY = process.env.LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Search for tracks using Last.fm API
 * @param {string} query Search query
 * @param {number} limit Maximum number of results
 * @returns {Promise<Array>} Array of track objects
 */
async function searchTracks(query, limit = 10) {
  try {
    // Always ensure limit is a number
    const numericLimit = parseInt(limit);
    const validLimit = isNaN(numericLimit) ? 10 : Math.min(Math.max(1, numericLimit), 50);
    
    const response = await axios.get(BASE_URL, {
      params: {
        method: 'track.search',
        track: query,
        api_key: API_KEY,
        format: 'json',
        limit: validLimit
      }
    });
    
    // Check if we have results
    if (!response.data || !response.data.results || !response.data.results.trackmatches || !response.data.results.trackmatches.track) {
      return [];
    }
    
    // Make sure we always return an array (Last.fm returns an object for single results)
    const tracks = Array.isArray(response.data.results.trackmatches.track) 
      ? response.data.results.trackmatches.track 
      : [response.data.results.trackmatches.track];
    
    // Process each track to enhance with extra data like album art
    const enhancedTracks = await Promise.all(
      tracks.map(async track => {
        // Get additional track info if needed
        let additionalInfo = null;
        try {
          additionalInfo = await getTrackInfo(track.artist, track.name);
        } catch (error) {
          console.log(`Couldn't get additional info for ${track.name}`);
        }
        
        return {
          id: `${track.artist}-${track.name}`.replace(/[^a-zA-Z0-9]/g, ''),
          name: track.name,
          artist: track.artist,
          // Use image from track info if available, otherwise from search results
          albumArt: (additionalInfo && additionalInfo.album && additionalInfo.album.image) 
            ? additionalInfo.album.image.find(img => img.size === 'large')['#text']
            : (track.image && track.image.length > 0)
              ? track.image.find(img => img.size === 'large')['#text']
              : null,
          // Add album name if available from track info
          album: additionalInfo && additionalInfo.album ? additionalInfo.album.title : null,
          // We'll search for these songs on YouTube
          searchQuery: `${track.artist} - ${track.name} official`
        };
      })
    );
    
    return enhancedTracks;
  } catch (error) {
    console.error('Error searching tracks on Last.fm:', error.response?.data || error.message);
    throw new Error('Failed to search tracks');
  }
}

/**
 * Get detailed track information from Last.fm API
 * @param {string} artist Artist name
 * @param {string} track Track name
 * @returns {Promise<Object>} Track details
 */
async function getTrackInfo(artist, track) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        method: 'track.getInfo',
        artist: artist,
        track: track,
        api_key: API_KEY,
        format: 'json'
      }
    });
    
    if (response.data && response.data.track) {
      return response.data.track;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting track info from Last.fm:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  searchTracks,
  getTrackInfo
};