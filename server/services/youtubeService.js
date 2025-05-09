// server/services/youtubeService.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// YouTube API credentials
const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for videos related to a song
 * @param {string} query Search query (artist + track name)
 * @param {number} maxResults Maximum number of results (1-5)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(query, maxResults = 3) {
  try {
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

module.exports = {
  searchVideos,
  getEmbedUrl,
  getWatchUrl
};