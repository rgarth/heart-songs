// server/services/botService.js
const axios = require('axios');

class BotService {
  constructor() {
    this.botApiUrl = process.env.BOT_SERVICE_URL || 'https://api.heartsongs.com/bot';
  }

  /**
   * Spawn a bot and add it to a game
   * @param {Object} options - Bot configuration
   * @param {string} options.gameCode - Game code to join
   * @param {string} options.gameId - Game ID
   * @param {string} options.personality - Bot personality type
   * @returns {Promise<Object>} Bot spawn result
   */
  async spawnBot({ gameCode, gameId, personality = 'eclectic' }) {
    try {
      console.log(`Spawning bot for game ${gameCode} with personality: ${personality}`);
      
      const response = await axios.post(`${this.botApiUrl}/spawn-bot`, {
        gameCode,
        gameId,
        personality
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Bot spawn response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Bot spawn failed:', error.response?.data || error.message);
      throw new Error(`Failed to spawn bot: ${error.message}`);
    }
  }

  /**
   * Get available bot personalities
   * @returns {Array} List of available bot personalities
   */
  getAvailablePersonalities() {
    return [
      {
        id: 'eclectic',
        name: 'Eclectic Explorer',
        description: 'Loves discovering hidden gems across all genres',
        icon: '🌟'
      },
      {
        id: 'mainstream',
        name: 'Chart Topper',
        description: 'Knows all the hits and crowd favorites',
        icon: '📻'
      },
      {
        id: 'indie',
        name: 'Indie Insider',
        description: 'Champions underground and alternative artists',
        icon: '🎸'
      },
      {
        id: 'vintage',
        name: 'Time Traveler',
        description: 'Expert in classic tracks from decades past',
        icon: '📻'
      },
      {
        id: 'analytical',
        name: 'Music Scholar',
        description: 'Makes decisions based on musical theory and lyrics',
        icon: '🎓'
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
   * @returns {Object} Bot information
   */
  getBotInfo(displayName) {
    if (!this.isBot(displayName)) {
      return null;
    }

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
}

module.exports = new BotService();

// server/routes/bot.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const botService = require('../services/botService');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all bot routes
router.use(authenticateUser);

// Get available bot personalities
router.get('/personalities', async (req, res) => {
  try {
    const personalities = botService.getAvailablePersonalities();
    res.json({
      personalities
    });
  } catch (error) {
    console.error('Error getting bot personalities:', error);
    res.status(500).json({ error: 'Failed to get bot personalities' });
  }
});

// Add bot to game
router.post('/add-to-game', async (req, res) => {
  try {
    const { gameId, personality = 'eclectic' } = req.body;
    const user = req.user;

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Find game by _id or code
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await Game.findById(gameId);
    }
    
    if (!game) {
      game = await Game.findOne({ code: gameId });
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can add bots' });
    }

    // Check if game is in waiting state
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Can only add bots to games in lobby' });
    }

    // Check if there's room for more players (assuming max 6)
    if (game.players.length >= 6) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if personality is valid
    const availablePersonalities = botService.getAvailablePersonalities();
    const personalityExists = availablePersonalities.some(p => p.id === personality);
    
    if (!personalityExists) {
      return res.status(400).json({ error: 'Invalid bot personality' });
    }

    try {
      // Spawn the bot
      const botResult = await botService.spawnBot({
        gameCode: game.code,
        gameId: game._id.toString(),
        personality
      });

      console.log('Bot added successfully:', botResult);

      res.json({
        success: true,
        botId: botResult.botId,
        botName: botResult.botName,
        personality: botResult.personality,
        message: botResult.message || 'Bot is joining the game...'
      });

    } catch (botError) {
      console.error('Bot service error:', botError);
      
      // Return user-friendly error
      return res.status(500).json({ 
        error: 'Failed to add bot to game',
        details: 'The bot service is temporarily unavailable. Please try again.'
      });
    }

  } catch (error) {
    console.error('Error adding bot to game:', error);
    res.status(500).json({ error: 'Failed to add bot to game' });
  }
});

// Remove bot from game (if needed)
router.post('/remove-from-game', async (req, res) => {
  try {
    const { gameId, botId } = req.body;
    const user = req.user;

    if (!gameId || !botId) {
      return res.status(400).json({ error: 'Game ID and Bot ID are required' });
    }

    // Find game
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await Game.findById(gameId);
    }
    
    if (!game) {
      game = await Game.findOne({ code: gameId });
    }
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can remove bots' });
    }

    // Find the bot player
    const botPlayerIndex = game.players.findIndex(p => p.user.toString() === botId);
    
    if (botPlayerIndex === -1) {
      return res.status(404).json({ error: 'Bot not found in this game' });
    }

    // Remove the bot player
    game.players.splice(botPlayerIndex, 1);
    await game.save();

    // Populate the updated game data
    await game.populate('players.user', 'displayName');

    res.json({
      success: true,
      message: 'Bot removed from game',
      players: game.players
    });

  } catch (error) {
    console.error('Error removing bot from game:', error);
    res.status(500).json({ error: 'Failed to remove bot from game' });
  }
});

// Get bot statistics (for future analytics)
router.get('/stats', async (req, res) => {
  try {
    // This could be expanded to show bot performance metrics
    res.json({
      message: 'Bot statistics not yet implemented',
      availablePersonalities: botService.getAvailablePersonalities().length
    });
  } catch (error) {
    console.error('Error getting bot stats:', error);
    res.status(500).json({ error: 'Failed to get bot statistics' });
  }
});

module.exports = router;

// server/index.js - ADD THIS TO YOUR EXISTING ROUTES
// Add this line with your other route imports:
const botRoutes = require('./routes/bot');

// Add this line with your other route uses:
app.use('/api/bot', botRoutes);

// server/models/Game.js - ADD BOT HELPER METHODS
// Add these methods to your existing Game schema:

// Helper method to check if a player is a bot
GameSchema.methods.isPlayerBot = function(playerId) {
  const player = this.players.find(p => p.user.toString() === playerId.toString());
  if (!player) return false;
  
  // This would need the populated user data
  return player.user.displayName && player.user.displayName.includes('_bot_');
};

// Helper method to get all bot players
GameSchema.methods.getBotPlayers = function() {
  return this.players.filter(player => {
    return player.user.displayName && player.user.displayName.includes('_bot_');
  });
};

// Helper method to get human players only
GameSchema.methods.getHumanPlayers = function() {
  return this.players.filter(player => {
    return !player.user.displayName || !player.user.displayName.includes('_bot_');
  });
};