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

module.exports = router;