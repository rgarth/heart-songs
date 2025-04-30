// server/routes/game.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const Question = require('../models/Question');
const { createPlaylist, addTrackToPlaylist } = require('../services/spotifyService');

// Generate a random game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get random uestion
async function getRandomQuestion() {
  const count = await Question.countDocuments();
  const random = Math.floor(Math.random() * count);
  return Question.findOne().skip(random);
}

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;
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

// Join a game
router.post('/join', async (req, res) => {
  try {
    const { gameCode, userId } = req.body;
    
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
    
    const game = await Game.findById(gameId);
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
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selecting phase' });
    }
    
    // Check if user already submitted
    const existingSubmission = game.submissions.find(s => s.player.toString() === userId);
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
    const host = await User.findById(game.host);
    await addTrackToPlaylist(host.accessToken, game.playlistId, songId);
    
    await game.save();
    
    // Check if all players have submitted
    const allSubmitted = game.players.length === game.submissions.length;
    
    if (allSubmitted) {
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
    res.status(500).json({ error: 'Failed to submit song' });
  }
});

// Vote for a song
router.post('/vote', async (req, res) => {
  try {
    const { gameId, userId, submissionId } = req.body;
    
    const game = await Game.findById(gameId);
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
    
    // Check if player is voting for their own submission
    if (submission.player.toString() === userId) {
      return res.status(400).json({ error: 'Cannot vote for your own submission' });
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
    const { gameId } = req.body;
    
    const game = await Game.findById(gameId);
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
    
    // Get new question
    const question = await getRandomQuestion();
    game.currentQuestion = {
      text: question.text,
      category: question.category
    };
    
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
    
    const game = await Game.findById(gameId)
      .populate('host', 'displayName profileImage')
      .populate('players.user', 'displayName profileImage')
      .populate('submissions.player', 'displayName profileImage')
      .populate('submissions.votes', 'displayName profileImage');
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({
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

module.exports = router;