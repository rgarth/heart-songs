// client/src/services/botService.js - ENHANCED with retry logic

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

class BotService {
  constructor() {
    this.pendingRequests = new Map(); // Prevent duplicate requests
  }

  /**
   * Get available bot personalities
   * @returns {Promise<Array>} Array of bot personalities
   */
  async getPersonalities() {
    try {
      const response = await fetch(`${API_URL}/bot/personalities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch personalities');
      }
      
      const data = await response.json();
      return data.personalities || [];
    } catch (error) {
      console.error('Failed to get bot personalities:', error);
      return [];
    }
  }

  /**
   * Add a bot to a game with retry logic and duplicate prevention
   * @param {string} gameId - Game ID or code
   * @param {string} personality - Bot personality ID
   * @returns {Promise<Object>} Bot creation result
   */
  async addBotToGame(gameId, personality = 'eclectic') {
    // Create unique key for this request
    const requestKey = `${gameId}-${personality}`;
    
    // Check if we're already processing this request
    if (this.pendingRequests.has(requestKey)) {
      console.log('🔄 Bot addition already in progress, waiting for completion...');
      return this.pendingRequests.get(requestKey);
    }

    // Create the request promise
    const requestPromise = this._addBotWithRetry(gameId, personality);
    
    // Store it to prevent duplicates
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Internal method with retry logic
   * @private
   */
  async _addBotWithRetry(gameId, personality, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Adding bot attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch(`${API_URL}/bot/add-to-game`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ gameId, personality }),
          // Progressive timeout increase
          signal: AbortSignal.timeout(10000 + (attempt * 5000)) // 10s, 15s, 20s
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Check for specific error types that shouldn't be retried
          if (response.status === 400 || response.status === 403 || response.status === 404) {
            console.log(`❌ Bot addition failed with ${response.status} - not retrying`);
            throw new Error(data.error || 'Failed to add bot');
          }
          
          // For 500+ errors, we'll retry
          throw new Error(data.error || `Server error (${response.status})`);
        }
        
        console.log(`✅ Bot added successfully on attempt ${attempt}`);
        return data;
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Bot addition attempt ${attempt} failed:`, error.message);
        
        // Don't retry for certain error types
        if (error.name === 'AbortError') {
          console.log('⏰ Request timed out');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('🌐 Network error');
        } else if (error.message.includes('400') || error.message.includes('403')) {
          console.log('🚫 Client error - not retrying');
          throw error;
        }
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          const jitter = Math.random() * 1000; // Add some randomness
          const totalDelay = delay + jitter;
          
          console.log(`⏳ Waiting ${Math.round(totalDelay)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }
    }
    
    // If we get here, all retries failed
    console.error(`❌ All ${maxRetries} bot addition attempts failed`);
    throw new Error(`Failed to add bot after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Remove a bot from a game
   * @param {string} gameId - Game ID or code
   * @param {string} botId - Bot user ID
   * @returns {Promise<Object>} Removal result
   */
  async removeBotFromGame(gameId, botId) {
    try {
      const response = await fetch(`${API_URL}/bot/remove-from-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ gameId, botId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove bot');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to remove bot:', error);
      throw error;
    }
  }

  /**
   * Check if a display name belongs to a bot
   * @param {string} displayName - User's display name
   * @returns {boolean} True if user is a bot
   */
  isBot(displayName) {
    return displayName && displayName.includes('_bot_');
  }

  /**
   * Extract bot information from display name
   * @param {string} displayName - Bot's display name
   * @returns {Object|null} Bot information or null if not a bot
   */
  getBotInfo(displayName) {
    if (!this.isBot(displayName)) return null;
    
    const parts = displayName.split('_');
    if (parts.length >= 3 && parts[1] === 'bot') {
      return {
        type: parts[0],
        id: parts[2],
        isBot: true,
        emoji: '🤖'
      };
    }
    
    return {
      type: 'unknown',
      id: 'unknown',
      isBot: true,
      emoji: '🤖'
    };
  }

  /**
   * Get personality emoji for a bot type
   * @param {string} type - Bot type (from display name)
   * @returns {string} Emoji for the bot type
   */
  getBotEmoji(type) {
    const emojiMap = {
      vinyl: '📻',
      beat: '🥁',
      rhythm: '🎵',
      melody: '🎼',
      harmony: '🎶',
      bass: '🎸',
      treble: '🎺',
      tempo: '⏱️',
      chord: '🎹',
      riff: '🎸',
      groove: '🕺',
      sync: '🔄',
      echo: '📢',
      reverb: '🌊',
      pitch: '🎯',
      tone: '🔊',
      vibe: '✨',
      flow: '🌊',
      pulse: '💓',
      wave: '🌊',
      // Personality-based prefixes
      eclectic: '🎭',
      pop: '⭐',
      indie: '🎸',
      classic: '📻',
      maestro: '🎼'
    };
    
    return emojiMap[type] || '🤖';
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  getUserFriendlyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'The bot service is taking longer than expected. Please try again.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the bot service. Check your internet connection and try again.';
    }
    
    if (message.includes('already taken') || message.includes('duplicate')) {
      return 'A bot is already in this game.';
    }
    
    if (message.includes('game not found')) {
      return 'Game not found. The game may have ended.';
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'You don\'t have permission to add bots to this game.';
    }
    
    if (message.includes('full')) {
      return 'The game is full and cannot accept more players.';
    }
    
    if (message.includes('after') && message.includes('attempts')) {
      return 'Bot service is experiencing issues. Please wait a moment and try again.';
    }
    
    // Return the original error message if we can't categorize it
    return error.message || 'An unexpected error occurred while adding the bot.';
  }
}

// Create singleton instance
const botService = new BotService();

// Export singleton instance
export default botService;