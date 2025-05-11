// server/services/youtubeService.js - Updated with proper video/audio preference handling
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
 * @param {boolean} preferVideo Whether to prefer music videos over audio versions (default: false)
 * @param {number} maxResults Maximum number of results (1-5)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(query, preferVideo = false, maxResults = 3) {
  try {
    // If quota is exhausted and reset time hasn't passed, return empty array
    if (quotaExhausted && quotaResetTime && new Date() < quotaResetTime) {
      console.log(`YouTube quota still exhausted. Will reset at ${quotaResetTime}`);
      return [];
    }
    
    // Validate maxResults
    const validMaxResults = Math.min(Math.max(1, maxResults), 5);
    
    // Define search strategies based on preference
    let searchStrategies = [];
    
    if (preferVideo) {
      // For video preference, try to find actual music videos
      searchStrategies = [
        `${query} music video`,
        `${query} official video`,
        `${query} video`,
        query // fallback to basic search
      ];
    } else {
      // For audio preference, try to find audio-only or topic channel content
      searchStrategies = [
        `${query} official audio`,
        `${query} audio`,
        `${query} topic`,
        `${query} official`,
        query // fallback to basic search
      ];
    }
    
    console.log(`[YOUTUBE SERVICE] Searching for: "${query}" (preferVideo: ${preferVideo})`);
    console.log(`[YOUTUBE SERVICE] Will try ${searchStrategies.length} search strategies`);
    
    // Try each search strategy until we get good results
    for (let i = 0; i < searchStrategies.length; i++) {
      const searchQuery = searchStrategies[i];
      
      try {
        console.log(`[YOUTUBE SERVICE] Attempt ${i + 1}: searching for "${searchQuery}"`);
        
        const response = await axios.get(`${BASE_URL}/search`, {
          params: {
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            videoEmbeddable: true,
            videoCategoryId: '10', // Music category
            maxResults: validMaxResults,
            key: API_KEY
          }
        });
        
        // Reset quota status on successful request
        quotaExhausted = false;
        quotaResetTime = null;
        
        if (!response.data || !response.data.items || !response.data.items.length) {
          console.log(`[YOUTUBE SERVICE] No results for strategy ${i + 1}, trying next...`);
          continue;
        }
        
        // Map results to a simpler format
        const results = response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle
        }));
        
        console.log(`[YOUTUBE SERVICE] Found ${results.length} results with strategy ${i + 1}`);
        console.log(`[YOUTUBE SERVICE] Results: ${results.map(r => r.title).join(', ')}`);
        
        // Filter results based on preference
        const filteredResults = filterResultsByPreference(results, preferVideo);
        
        if (filteredResults.length > 0) {
          console.log(`[YOUTUBE SERVICE] After filtering: ${filteredResults.length} results match preference`);
          return filteredResults;
        }
        
        // If filtering doesn't help, return original results on first successful strategy
        if (i === 0) {
          console.log(`[YOUTUBE SERVICE] Using unfiltered results from first strategy`);
          return results;
        }
        
      } catch (strategyError) {
        console.error(`[YOUTUBE SERVICE] Error with strategy ${i + 1}:`, strategyError.message);
        
        // If it's a quota error on the first attempt, handle it
        if (i === 0 && strategyError.response?.data?.error?.code === 403 && 
            strategyError.response?.data?.error?.message?.includes('quota')) {
          
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
        
        // For other errors, continue to next strategy
        continue;
      }
    }
    
    console.log(`[YOUTUBE SERVICE] All search strategies failed`);
    return [];
    
  } catch (error) {
    console.error('Error searching YouTube videos:', error.response?.data || error.message);
    throw new Error('Failed to search videos');
  }
}

/**
 * Filter search results based on video/audio preference
 * @param {Array} results YouTube search results
 * @param {boolean} preferVideo Whether video content is preferred
 * @returns {Array} Filtered results
 */
function filterResultsByPreference(results, preferVideo) {
  return results.filter(result => {
    const titleLower = result.title.toLowerCase();
    const channelLower = result.channelTitle.toLowerCase();
    
    // Indicators for different types of content
    const videoIndicators = [
      'music video',
      'official video',
      'live performance',
      'concert',
      'behind the scenes',
      'making of'
    ];
    
    const audioIndicators = [
      'official audio',
      'audio only',
      'audio',
      'topic',
      'full album',
      'soundtrack'
    ];
    
    // Check for explicit indicators
    const hasVideoIndicator = videoIndicators.some(indicator => titleLower.includes(indicator));
    const hasAudioIndicator = audioIndicators.some(indicator => titleLower.includes(indicator));
    
    // Special handling for YouTube's Topic channels (usually audio)
    const isTopicChannel = channelLower.includes('topic') || channelLower.includes(' - topic');
    
    // Special handling for VEVO channels (usually music videos)
    const isVevoChannel = channelLower.includes('vevo');
    
    if (preferVideo) {
      // For video preference, prioritize actual videos
      if (hasAudioIndicator && !hasVideoIndicator) return false;
      if (isTopicChannel && !hasVideoIndicator) return false;
      return true;
    } else {
      // For audio preference, prioritize audio-like content
      if (hasVideoIndicator && !hasAudioIndicator) return false;
      if (isVevoChannel && hasVideoIndicator) return false;
      return true;
    }
  });
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