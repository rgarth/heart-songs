// server/routes/game.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const Question = require('../models/Question');
const { createPlaylist, addTrackToPlaylist, deletePlaylist } = require('../services/spotifyService');

// Generate a random game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get random question
async function getRandomQuestion() {
  const count = await Question.countDocuments();
  const random = Math.floor(Math.random() * count);
  return Question.findOne().skip(random);
}

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Creating game for userId:', userId);
    
    const host = await User.findById(userId);
    
    if (!host) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate a unique game code
    let gameCode;
    let isUnique = false;
    
    while (!isUnique) {
      gameCode = generateGameCode();
      const existingGame = await Game.findOne({ code: gameCode });
      isUnique = !existingGame;
    }
    
    // Create the game
    const game = new Game({
      code: gameCode,
      host: host._id,
      players: [{ user: host._id, isReady: false }]
    });
    
    await game.save();
    
    console.log('Game created:', game._id, 'with code:', game.code);
    
    res.json({
      gameId: game._id,
      gameCode: game.code,
      host: {
        id: host._id,
        displayName: host.displayName
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { gameCode, userId } = req.body;
    console.log('Joining game with code:', gameCode, 'for userId:', userId);
    
    const game = await Game.findOne({ code: gameCode });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already in progress' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already in the game
    const existingPlayer = game.players.find(p => p.user.toString() === userId);
    if (!existingPlayer) {
      game.players.push({
        user: user._id,
        isReady: false,
        score: 0
      });
      await game.save();
      console.log(`Player ${userId} added to game ${gameCode}`);
    } else {
      console.log(`Player ${userId} is already in game ${gameCode}, not adding again`);
    }
    
    // Populate players
    await game.populate('players.user', 'displayName profileImage');
    await game.populate('host', 'displayName profileImage');
    
    res.json({
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Toggle ready status
router.post('/ready', async (req, res) => {
  try {
    const { gameId, userId } = req.body;
    console.log('Toggling ready status for gameId:', gameId, 'userId:', userId);
    
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
    
    // Find the player
    const playerIndex = game.players.findIndex(p => p.user.toString() === userId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }
    
    // Toggle ready status
    game.players[playerIndex].isReady = !game.players[playerIndex].isReady;
    await game.save();
    
    // Check if all players are ready
    const allReady = game.players.every(p => p.isReady);
    
    // If all players are ready, start the game
    if (allReady && game.status === 'waiting') {
      // Check if there are at least 2 players before starting the game
      if (game.players.length < 2) {
        // If less than 2 players, don't start the game yet but don't return an error
        // The frontend will handle disabling the ready button, but we still 
        // want to save the player's ready status
        console.log('Not enough players to start the game (minimum 2 required)');
      } else {
        // Enough players, proceed with starting the game
        // Create playlist
      const host = await User.findById(game.host);
      const playlist = await createPlaylist(
        host.accessToken,
        `Song Game - ${game.code}`,
        'Collaborative playlist for the song selection game'
      );
      
      game.playlistId = playlist.id;
      
      // Get random question
      const question = await getRandomQuestion();
      game.currentQuestion = {
        text: question.text,
        category: question.category
      };
      
      game.status = 'selecting';
      await game.save();
    }
    }
    
    // Populate game data
    await game.populate('players.user', 'displayName profileImage');
    
    res.json({
      gameId: game._id,
      status: game.status,
      players: game.players,
      currentQuestion: game.currentQuestion,
      playlistId: game.playlistId
    });
  } catch (error) {
    console.error('Error updating ready status:', error);
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

// Submit song selection
router.post('/submit', async (req, res) => {
  try {
    const { gameId, userId, songId, songName, artist, albumCover } = req.body;
    
    // Log detailed information for debugging
    console.log('Submit song request:', { 
      gameId, 
      userId, 
      songId, 
      songName 
    });
    console.log('gameId type:', typeof gameId);
    
    // Validate required parameters
    if (!gameId || !userId || !songId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { gameId, userId, songId }
      });
    }
    
    // Find game by _id or code
    let game = null;
    
    // First try to find by _id if it looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      console.log('Looking up game by _id:', gameId);
      game = await Game.findById(gameId);
    }
    
    // If not found, try by code
    if (!game) {
      console.log('Looking up game by code:', gameId);
      game = await Game.findOne({ code: gameId });
    }
    
    // If still not found, return debugging info
    if (!game) {
      // Get a list of all games for debugging
      const allGames = await Game.find({}, '_id code').limit(5);
      console.log('Available games:', allGames);
      
      return res.status(404).json({ 
        error: 'Game not found', 
        gameId,
        tip: 'Make sure you\'re using the correct game ID (either MongoDB _id or game code)' 
      });
    }
    
    console.log('Game found:', game._id, 'with code:', game.code);
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selecting phase' });
    }
    
    // Check if user already submitted
    const existingSubmission = game.submissions.find(s => s.player && s.player.toString() === userId);
    
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.songId = songId;
      existingSubmission.songName = songName;
      existingSubmission.artist = artist;
      existingSubmission.albumCover = albumCover;
    } else {
      // Create new submission
      game.submissions.push({
        player: userId,
        songId,
        songName,
        artist,
        albumCover,
        votes: []
      });
    }
    
    // Add track to playlist
    try {
      const host = await User.findById(game.host);
      await addTrackToPlaylist(host.accessToken, game.playlistId, songId);
    } catch (playlistError) {
      console.error('Error adding track to playlist:', playlistError);
      // Continue even if there's an error with the playlist
    }
    
    await game.save();
    console.log('Song submitted successfully, submissions count:', game.submissions.length);
    
    // Check if all players have submitted
    const allSubmitted = game.players.length === game.submissions.length;
    
    if (allSubmitted) {
      console.log('All players have submitted, changing game status to voting');
      game.status = 'voting';
      await game.save();
    }
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions.length
    });
  } catch (error) {
    console.error('Error submitting song:', error);
    res.status(500).json({ error: 'Failed to submit song', details: error.message });
  }
});

// Vote for a song
router.post('/vote', async (req, res) => {
  try {
    const { gameId, userId, submissionId } = req.body;
    console.log('Vote request:', { gameId, userId, submissionId });
    
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
    
    if (game.status !== 'voting') {
      return res.status(400).json({ error: 'Game is not in voting phase' });
    }
    
    // Find the submission
    const submission = game.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // NEW FEATURE: Check player count to determine if players can vote for their own submissions
    const canVoteForSelf = game.players.length < 3;
    
    // Check if player is voting for their own submission
    if (submission.player.toString() === userId && !canVoteForSelf) {
      return res.status(400).json({ error: 'Cannot vote for your own submission in games with 3 or more players' });
    }
    
    // Check if player already voted
    const alreadyVoted = game.submissions.some(s => 
      s.votes.some(v => v.toString() === userId)
    );
    
    if (alreadyVoted) {
      // Remove previous vote
      game.submissions.forEach(s => {
        s.votes = s.votes.filter(v => v.toString() !== userId);
      });
    }
    
    // Add vote
    submission.votes.push(userId);
    await game.save();
    
    // Check if all players have voted
    const votesCount = game.submissions.reduce((acc, s) => acc + s.votes.length, 0);
    const allVoted = game.players.length === votesCount;
    
    if (allVoted) {
      game.status = 'results';
      
      // Update scores
      game.submissions.forEach(sub => {
        if (sub.votes.length > 0) {
          const playerIndex = game.players.findIndex(p => p.user.toString() === sub.player.toString());
          if (playerIndex !== -1) {
            game.players[playerIndex].score += sub.votes.length;
          }
        }
      });
      
      await game.save();

      // Clean up the playlist once voting is complete
      if (game.playlistId) {
        try {
          console.log(`Cleaning up playlist ${game.playlistId} after voting is complete`);
          const host = await User.findById(game.host);
          const { deletePlaylist } = require('../services/spotifyService');
          await deletePlaylist(host.accessToken, game.playlistId);
          console.log('Playlist successfully deleted after voting');
        } catch (error) {
          console.error('Error deleting playlist after voting:', error);
          // Continue even if there's an error with playlist deletion
        }
      }
      
      // Update user scores in the database
      for (const player of game.players) {
        await User.findByIdAndUpdate(player.user, { $inc: { score: player.score } });
      }
    }
    
    // Populate player data
    await game.populate('submissions.player', 'displayName profileImage');
    await game.populate('submissions.votes', 'displayName profileImage');
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Start a new round
router.post('/next-round', async (req, res) => {
  try {
    const { gameId, questionText, questionCategory } = req.body;
    console.log('Starting new round for gameId:', gameId);
    
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
    
    if (game.status !== 'results') {
      return res.status(400).json({ error: 'Game is not in results phase' });
    }
    
    // Clear submissions
    game.submissions = [];
    
    // Reset ready status
    game.players.forEach(player => {
      player.isReady = false;
    });
    
    // Set question - either use provided question or get a random one
    if (questionText && questionCategory) {
      // Use the provided question
      game.currentQuestion = {
        text: questionText,
        category: questionCategory
      };
    } else {
      // Get new random question
      const question = await getRandomQuestion();
      game.currentQuestion = {
        text: question.text,
        category: question.category
      };
    }
    
    // Create new playlist
    const host = await User.findById(game.host);
    const playlist = await createPlaylist(
      host.accessToken,
      `Song Game - ${game.code} - Round ${Date.now()}`,
      'Collaborative playlist for the song selection game'
    );
    
    game.playlistId = playlist.id;
    game.status = 'selecting';
    
    await game.save();
    
    res.json({
      gameId: game._id,
      status: game.status,
      currentQuestion: game.currentQuestion,
      playlistId: game.playlistId
    });
  } catch (error) {
    console.error('Error starting new round:', error);
    res.status(500).json({ error: 'Failed to start new round' });
  }
});

// Get game state
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
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
    
    await game.populate('host', 'displayName profileImage');
    await game.populate('players.user', 'displayName profileImage');
    await game.populate('submissions.player', 'displayName profileImage');
    await game.populate('submissions.votes', 'displayName profileImage');
    
    res.json({
      _id: game._id,
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players,
      currentQuestion: game.currentQuestion,
      playlistId: game.playlistId,
      submissions: game.submissions
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

router.get('/:gameId/question-preview', async (req, res) => {
  try {
    const { gameId } = req.params;
    console.log('Getting question preview for game:', gameId);
    
    // Find game to validate it exists
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
    
    // Get random question (but don't save it to the game yet)
    const question = await getRandomQuestion();
    
    res.json({
      question: {
        text: question.text,
        category: question.category
      }
    });
  } catch (error) {
    console.error('Error getting question preview:', error);
    res.status(500).json({ error: 'Failed to get question preview' });
  }
});

// Submit a custom question for the next round
router.post('/:gameId/custom-question', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { questionText } = req.body;
    
    console.log('Submitting custom question for game:', gameId);
    
    if (!questionText || questionText.trim() === '') {
      return res.status(400).json({ error: 'Question text is required' });
    }
    
    // Find game to validate it exists
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
    
    // Create a custom question (in memory, not saved to the database)
    const customQuestion = {
      text: questionText,
      category: 'custom'
    };
    
    res.json({
      question: customQuestion
    });
  } catch (error) {
    console.error('Error submitting custom question:', error);
    res.status(500).json({ error: 'Failed to submit custom question' });
  }
});


// Debug endpoint to list all games
router.get('/debug/all', async (req, res) => {
  try {
    const games = await Game.find({})
      .select('_id code status host players.length submissions.length')
      .limit(10);
    
    res.json({ games });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Failed to list games' });
  }
});

module.exports = router;