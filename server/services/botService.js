// server/services/botService.js
const axios = require('axios');

class BotService {
  constructor() {
    this.botApiUrl = process.env.BOT_SERVICE_URL;
    
    if (!this.botApiUrl) {
      console.warn('BOT_SERVICE_URL not set - bot features will be disabled');
    }
  }

  /**
   * Spawn a bot and add it to a game
   * @param {Object} options - Bot configuration
   * @param {string} options.gameCode - Game code to join
   * @param {string} options.gameId - Game ID
   * @param {string} options.personality - Bot personality type (defaults to analytical)
   * @returns {Promise<Object>} Bot spawn result
   */
  async spawnBot({ gameCode, gameId, personality = 'analytical' }) {
    if (!this.botApiUrl) {
      throw new Error('Bot service is not configured - please set BOT_SERVICE_URL environment variable');
    }

    try {
      console.log(`Spawning Music Scholar bot for game ${gameCode}`);
      
      const response = await axios.post(`${this.botApiUrl}/spawn-bot`, {
        gameCode,
        gameId,
        personality: 'analytical' // Always use analytical (Music Scholar)
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bot spawn response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Bot spawn failed:', error.response?.data || error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Bot service is unreachable - check BOT_SERVICE_URL');
      } else if (error.response?.status === 404) {
        throw new Error('Bot service endpoint not found - check your Lambda deployment');
      } else if (error.response?.status >= 500) {
        throw new Error('Bot service internal error - check Lambda logs');
      } else {
        throw new Error(`Failed to spawn bot: ${error.message}`);
      }
    }
  }

  /**
   * Get available bot personalities - now only returns Music Scholar
   * @returns {Array} List of available bot personalities
   */
  getAvailablePersonalities() {
    return [
      {
        id: 'analytical',
        name: 'Music Scholar',
        description: 'Makes decisions based on musical theory and lyrics',
        //icon: '🎓'
      }
    ];
  }

  /**
   * Check if a user is a bot based on display name
   * @param {string} displayName - User's display name
   * @returns {boolean} True if user is a bot
   */
  isBot(displayName) {
    return displayName && displayName.includes('_bot_');
  }

  /**
   * Get bot info from display name
   * @param {string} displayName - Bot's display name
   * @returns {Object|null} Bot information or null if not a bot
   */
  getBotInfo(displayName) {
    if (!this.isBot(displayName)) {
      return null;
    }

    // For simplicity, all bots are now Music Scholars
    const parts = displayName.split('_');
    if (parts.length >= 3 && parts[1] === 'bot') {
      return {
        type: parts[0],
        id: parts[2],
        isBot: true,
        personality: 'Music Scholar',
        //emoji: '🎓'
      };
    }

    return {
      type: 'unknown',
      id: 'unknown',
      isBot: true,
      personality: 'Music Scholar',
      //emoji: '🎓'
    };
  }

  /**
   * Check if bot service is available
   * @returns {boolean} True if bot service is configured
   */
  isAvailable() {
    return !!this.botApiUrl;
  }

  /**
   * Get bot service status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      url: this.botApiUrl ? 'configured' : 'not set',
      defaultPersonality: 'Music Scholar'
    };
  }
}

// Export singleton instance
module.exports = new BotService();
