#!/bin/bash

# Script to create all bot service files
# Run this from your heart-songs/client directory

echo "Creating bot service files..."

# Create directories
mkdir -p src/services
mkdir -p src/components/bot

# Create botService.js
cat > src/services/botService.js << 'EOF'
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
EOF

echo "✅ Created botService.js"

# Create BotPersonalitySelector.js
cat > src/components/bot/BotPersonalitySelector.js << 'EOF'
// client/src/components/bot/BotPersonalitySelector.js
import React from 'react';

const BotPersonalitySelector = ({ 
  onPersonalitySelect, 
  selectedPersonality, 
  personalities = [] 
}) => {
  if (personalities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-electric-purple border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-silver">Loading bot personalities...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {personalities.map((personality) => (
        <div
          key={personality.id}
          onClick={() => onPersonalitySelect(personality.id)}
          className={`
            cursor-pointer rounded-lg p-4 border-2 transition-all hover:scale-[1.02]
            ${selectedPersonality === personality.id 
              ? 'border-electric-purple bg-electric-purple/20 shadow-lg shadow-electric-purple/30' 
              : 'border-electric-purple/30 hover:border-electric-purple/60 bg-stage-dark/50'
            }
          `}
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">{personality.icon}</span>
            <h4 className="font-bold text-white text-lg">{personality.name}</h4>
          </div>
          <p className="text-silver text-sm leading-relaxed">
            {personality.description}
          </p>
          
          {selectedPersonality === personality.id && (
            <div className="mt-3 flex items-center text-electric-purple">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Selected</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BotPersonalitySelector;
EOF

echo "✅ Created BotPersonalitySelector.js"

# Create the other files...
echo "📝 Please copy the remaining files manually from the artifacts:"
echo "   - AddBotModal.js"
echo "   - BotPlayerDisplay.js" 
echo "   - AddBotButton.js"
echo "   - index.js"

echo "🎯 Or continue with the manual creation process."
