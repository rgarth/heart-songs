// server/services/youtubeService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// YouTube API credentials
const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Track quota status
let quotaExhausted = false;
let quotaResetTime = null;

/**
 * Search for videos related to a song
 * @param {string} query Search query (artist + track name)
 * @param {number} maxResults Maximum number of results (1-5)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(query, maxResults = 3) {
  try {
    // If quota is exhausted and reset time hasn't passed, return empty array
    if (quotaExhausted && quotaResetTime && new Date() < quotaResetTime) {
      console.log(`YouTube quota still exhausted. Will reset at ${quotaResetTime}`);
      return [];
    }
    
    // Validate maxResults
    const validMaxResults = Math.min(Math.max(1, maxResults), 5);
    
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query + ' audio',
        type: 'video',
        videoEmbeddable: true,
        maxResults: validMaxResults,
        key: API_KEY
      }
    });
    
    // Reset quota status on successful request
    quotaExhausted = false;
    quotaResetTime = null;
    
    if (!response.data || !response.data.items || !response.data.items.length) {
      return [];
    }
    
    // Map results to a simpler format
    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('Error searching YouTube videos:', error.response?.data || error.message);
    
    // Check if it's a quota error
    if (error.response?.data?.error?.code === 403 && 
        error.response?.data?.error?.message?.includes('quota')) {
      
      quotaExhausted = true;
      // Set reset time to next day at midnight PST (YouTube quota resets at midnight PST)
      const now = new Date();
      const resetTime = new Date();
      resetTime.setDate(now.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0); // Midnight
      // Adjust for PST (UTC-8) - simplified approximation
      resetTime.setHours(resetTime.getHours() + 8);
      quotaResetTime = resetTime;
      
      console.warn(`YouTube quota exhausted. Will reset at ${quotaResetTime}`);
      
      // Return empty array instead of throwing an error
      return [];
    }
    
    throw new Error('Failed to search videos');
  }
}

/**
 * Get the embedUrl for a YouTube video
 * @param {string} videoId YouTube video ID
 * @returns {string} URL for embedding the video
 */
function getEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get the watch URL for a YouTube video
 * @param {string} videoId YouTube video ID
 * @returns {string} URL for watching the video
 */
function getWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Check if YouTube quota is currently exhausted
 * @returns {boolean} Whether quota is exhausted
 */
function isQuotaExhausted() {
  return quotaExhausted;
}

/**
 * Get the time when quota will reset
 * @returns {Date|null} Reset time or null if not exhausted
 */
function getQuotaResetTime() {
  return quotaResetTime;
}

module.exports = {
  searchVideos,
  getEmbedUrl,
  getWatchUrl,
  isQuotaExhausted,
  getQuotaResetTime
};