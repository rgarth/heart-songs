// client/src/services/botService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

class BotService {
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
   * Add a bot to a game
   * @param {string} gameId - Game ID or code
   * @param {string} personality - Bot personality ID
   * @returns {Promise<Object>} Bot creation result
   */
  async addBotToGame(gameId, personality = 'eclectic') {
    try {
      const response = await fetch(`${API_URL}/bot/add-to-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ gameId, personality })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bot');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to add bot:', error);
      throw error;
    }
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
      wave: '🌊'
    };
    
    return emojiMap[type] || '🤖';
  }
}

// Export singleton instance
export default new BotService();
