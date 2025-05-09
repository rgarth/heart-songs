// server/routes/game.js - Updated to remove Spotify playlist functions
// This is a partial update focusing on the sections that need to be modified

// Update imports - remove spotifyService
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const Question = require('../models/Question');
const Playlist = require('../models/Playlist');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all game routes
router.use(authenticateUser);

// Generate a random game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get random question
async function getRandomQuestion() {
  const randomQuestions = await Question.aggregate([
    { $sample: { size: 1 } }
  ]);
  
  // If no questions found (unlikely but possible), fallback to original method
  if (!randomQuestions || randomQuestions.length === 0) {
    const count = await Question.countDocuments();
    const random = Math.floor(Math.random() * count);
    return Question.findOne().skip(random);
  }
  
  return randomQuestions[0];
}

// Submit song selection - UPDATED to remove Spotify playlist integration
router.post('/submit', async (req, res) => {
  try {
    const { gameId, userId, songId, songName, artist, albumCover, youtubeId } = req.body;
    
    // Log the request parameters for debugging
    console.log("Song submission request:", { 
      gameId, userId, songId, songName, artist, albumCover: albumCover?.substring(0, 20) + '...', youtubeId 
    });
    
    // Validate required parameters
    if (!gameId || !songId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { gameId, songId }
      });
    }
    
    // Find game by _id or code
    let game = null;
    
    // First try to find by _id if it looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await Game.findById(gameId);
    }
    
    // If not found, try by code
    if (!game) {
      game = await Game.findOne({ code: gameId });
    }
    
    // If still not found, return debugging info
    if (!game) {
      return res.status(404).json({ 
        error: 'Game not found', 
        gameId,
      });
    }
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selecting phase' });
    }
    
    // Find the user in the player list
    const playerIndex = game.players.findIndex(p => p.user.toString() === userId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }
    
    // Check if user already submitted
    const existingSubmission = game.submissions.find(s => s.player && s.player.toString() === userId);
    
    // Check if this is the first submission (fastest player)
    const isFirstSubmission = game.submissions.length === 0;

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.songId = songId;
      existingSubmission.songName = songName;
      existingSubmission.artist = artist;
      existingSubmission.albumCover = albumCover;
      existingSubmission.youtubeId = youtubeId; // Add YouTube ID
      existingSubmission.submittedAt = new Date(); // Update submission time
    } else {
      // Create new submission with timestamp and speed bonus if first
      game.submissions.push({
        player: userId,
        songId,
        songName,
        artist,
        albumCover,
        youtubeId, // Add YouTube ID
        submittedAt: new Date(),
        gotSpeedBonus: isFirstSubmission, // Award speed bonus to first submission
        votes: []
      });
    }
    
    await game.save();
    
    // Check if all ACTIVE players have submitted
    // If game was force-started, only count submissions from active players
    const expectedSubmissionsCount = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers.length 
      : game.players.length;
    
    const allSubmitted = game.submissions.length >= expectedSubmissionsCount;
    
    if (allSubmitted) {
      game.status = 'voting';
      await game.save();
    }
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions.length,
      expectedSubmissions: expectedSubmissionsCount,
      gotSpeedBonus: isFirstSubmission // Return whether this player got the speed bonus
    });

  } catch (error) {
    console.error('Error submitting song:', error);
    res.status(500).json({ error: 'Failed to submit song', details: error.message });
  }
});

// Force start game - UPDATED to remove Spotify playlist creation
router.post('/start', async (req, res) => {
  try {
    const { gameId, userId, questionText, questionCategory } = req.body;
    
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
    if (game.host.toString() !== userId) {
      return res.status(403).json({ error: 'Only the host can force start the game' });
    }
    
    // Check if there are at least 2 players
    if (game.players.length < 2) {
      return res.status(400).json({ error: 'At least 2 players are required to start the game' });
    }
    
    // Check if the game is already in progress
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is already in progress' });
    }

    // Create internal playlist for tracking
    try {
      // Create a new playlist document in our database
      const playlist = new Playlist({
        gameId: game._id.toString(),
        tracks: []
      });
      
      await playlist.save();
      
      // Store the playlist ID reference in the game
      game.playlistId = playlist._id.toString();
    } catch (playlistError) {
      console.error('Error creating internal playlist:', playlistError);
      // Continue even if there's an error with the playlist
    }
    
    // Set question - either use provided question or get a random one
    if (questionText && questionCategory) {
      // Use the provided question
      game.currentQuestion = {
        text: questionText,
        category: questionCategory
      };
    } else {
      // Get random question
      const question = await getRandomQuestion();
      game.currentQuestion = {
        text: question.text,
        category: question.category
      };
    }

    // Auto-ready the host if they're not already ready
    const hostPlayerIndex = game.players.findIndex(p => p.user.toString() === userId);
    if (hostPlayerIndex !== -1 && !game.players[hostPlayerIndex].isReady) {
      game.players[hostPlayerIndex].isReady = true;
    }
    
    // Critical fix: Make sure all ready players are added to activePlayers
    // This includes the host who we just made ready
    game.activePlayers = game.players
      .filter(player => player.isReady)
      .map(player => player.user);
    
    // Start the game regardless of ready status
    game.status = 'selecting';
    await game.save();
    
    // Populate game data
    await game.populate('players.user');
    await game.populate('activePlayers');
    
    res.json({
      gameId: game._id,
      status: game.status,
      players: game.players,
      activePlayers: game.activePlayers,
      currentQuestion: game.currentQuestion,
      playlistId: game.playlistId
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// End game - UPDATED to remove Spotify playlist finalization
router.post('/end', async (req, res) => {
  try {
    const { gameId } = req.body;
    // Important: Use req.user provided by the middleware instead of finding by userId
    const user = req.user;
    
    if (!user) {
      console.error('Authentication failed - no user attached to request');
      return res.status(401).json({ error: 'Authentication required' });
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
      console.error(`Game not found: ${gameId}`);
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      console.log(`Host mismatch: game.host=${game.host}, user._id=${user._id}`);
      return res.status(403).json({ error: 'Only the host can end the game' });
    }
    
    // Make sure to fully populate the submissions before finalizing the game
    // (This helps ensure we're returning all data for the last round)
    await game.populate('submissions.player', 'displayName');
    await game.populate('submissions.votes', 'displayName');
    
    // Get the current submissions before changing status
    // We need a deep copy to avoid reference issues
    const finalRoundSubmissions = JSON.parse(JSON.stringify(game.submissions || []));
    const currentQuestion = JSON.parse(JSON.stringify(game.currentQuestion || {}));
    
    // Change game status to ended and set the end timestamp
    game.status = 'ended';
    game.endedAt = new Date();
    // set TTL for mongo cleanup
    game.expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); 
    
    await game.save();
    
    // Get all tracks from internal playlist for this game
    let playlist = null;
    try {
      playlist = await Playlist.findOne({ gameId: game._id });
    } catch (playlistError) {
      console.error('Error fetching playlist:', playlistError);
      // Continue even if there's an error with the playlist
    }
    
    // Populate game data
    await game.populate('host', 'displayName');
    await game.populate('players.user', 'displayName score');
    
    // Create a structured response with the final round data included explicitly
    const response = {
      _id: game._id,
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players,
      // Include submissions in two places for compatibility
      submissions: finalRoundSubmissions,
      finalRoundData: {
        submissions: finalRoundSubmissions,
        question: currentQuestion
      },
      playlist: playlist ? playlist.tracks : [],
      endedAt: game.endedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Export the router
module.exports = router;