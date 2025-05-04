// server/routes/game.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const Question = require('../models/Question');
const Playlist = require('../models/Playlist');
const { authenticateUser } = require('../middleware/auth');
const { saveTrackToPlaylist } = require('../services/spotifyService');

// Apply authentication middleware to all game routes
router.use(authenticateUser);

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
    console.log('Create game route called');
    console.log('Request body:', req.body);
    console.log('User from auth middleware:', req.user ? {
      id: req.user._id,
      displayName: req.user.displayName
    } : 'No user attached to request');
    
    // Use the authenticated user from the middleware
    const host = req.user;
    
    if (!host) {
      console.error('Authentication middleware did not attach user to request');
      return res.status(401).json({ error: 'User authentication failed' });
    }
    
    console.log('Creating game for user:', host.displayName);
    
    // Generate a unique game code
    let gameCode;
    let isUnique = false;
    
    while (!isUnique) {
      gameCode = generateGameCode();
      const existingGame = await Game.findOne({ code: gameCode });
      isUnique = !existingGame;
    }
    
    console.log('Generated unique game code:', gameCode);
    
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
    res.status(500).json({ error: 'Failed to create game', details: error.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { gameCode } = req.body;
    const user = req.user;
    
    console.log('Joining game with code:', gameCode, 'for user:', user.displayName);
    
    const game = await Game.findOne({ code: gameCode });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already in progress' });
    }
    
    // Check if user is already in the game
    const existingPlayer = game.players.find(p => p.user.toString() === user._id.toString());
    let playerAdded = false;
    
    if (!existingPlayer) {
      game.players.push({
        user: user._id,
        isReady: false,
        score: 0
      });
      await game.save();
      console.log(`Player ${user.displayName} added to game ${gameCode}`);
      playerAdded = true;
    } else {
      console.log(`Player ${user.displayName} is already in game ${gameCode}, not adding again`);
    }
    
    // Populate players
    await game.populate('players.user', 'displayName');
    await game.populate('host', 'displayName');
    
    res.json({
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players,
      playerAdded: playerAdded
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Toggle ready status
router.post('/ready', async (req, res) => {
  try {
    const { gameId } = req.body;
    const user = req.user;
    
    console.log('Toggling ready status for gameId:', gameId, 'user:', user.displayName);
    
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
    const playerIndex = game.players.findIndex(p => p.user.toString() === user._id.toString());
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
        console.log('Not enough players to start the game (minimum 2 required)');
      } else {
        // Create playlist for the game in our database
        const playlist = new Playlist({
          gameId: game._id,
          tracks: []
        });
        await playlist.save();
        
        // Get random question
        const question = await getRandomQuestion();
        game.currentQuestion = {
          text: question.text,
          category: question.category
        };
        
        // When all players are ready, all players are active
        // Initialize activePlayers with all player IDs
        game.activePlayers = game.players.map(player => player.user);
        
        game.status = 'selecting';
        await game.save();
      }
    }
    
    // Populate game data
    await game.populate('players.user', 'displayName');
    if (game.activePlayers && game.activePlayers.length > 0) {
      await game.populate('activePlayers', 'displayName');
    }
    
    res.json({
      gameId: game._id,
      status: game.status,
      players: game.players,
      activePlayers: game.activePlayers || [],
      currentQuestion: game.currentQuestion
    });
  } catch (error) {
    console.error('Error updating ready status:', error);
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

// Submit song selection
router.post('/submit', async (req, res) => {
  try {
    const { gameId, songId, songName, artist, albumCover } = req.body;
    const user = req.user;
    
    // Log detailed information for debugging
    console.log('Submit song request:', { 
      gameId, 
      user: user.displayName, 
      songId, 
      songName 
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
      return res.status(404).json({ 
        error: 'Game not found', 
        gameId,
      });
    }
    
    console.log('Game found:', game._id, 'with code:', game.code);
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selecting phase' });
    }
    
    // Check if user already submitted
    const existingSubmission = game.submissions.find(s => s.player && s.player.toString() === user._id.toString());
    
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.songId = songId;
      existingSubmission.songName = songName;
      existingSubmission.artist = artist;
      existingSubmission.albumCover = albumCover;
    } else {
      // Create new submission
      game.submissions.push({
        player: user._id,
        songId,
        songName,
        artist,
        albumCover,
        votes: []
      });
    }
    
    // Add track to our playlist database
    try {
      await saveTrackToPlaylist(
        game._id.toString(), 
        songId, 
        songName, 
        artist, 
        albumCover || ''
      );
    } catch (playlistError) {
      console.error('Error adding track to playlist:', playlistError);
      // Continue even if there's an error with the playlist
    }
    
    await game.save();
    console.log('Song submitted successfully, submissions count:', game.submissions.length);
    
    // Check if all ACTIVE players have submitted
    // If game was force-started, only count submissions from active players
    const expectedSubmissionsCount = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers.length 
      : game.players.length;
    
    console.log(`Expected submissions: ${expectedSubmissionsCount}, Current submissions: ${game.submissions.length}`);
    const allSubmitted = game.submissions.length >= expectedSubmissionsCount;
    
    if (allSubmitted) {
      console.log('All active players have submitted, changing game status to voting');
      game.status = 'voting';
      await game.save();
    }
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions.length,
      expectedSubmissions: expectedSubmissionsCount
    });
  } catch (error) {
    console.error('Error submitting song:', error);
    res.status(500).json({ error: 'Failed to submit song', details: error.message });
  }
});

// Vote for a song
router.post('/vote', async (req, res) => {
  try {
    const { gameId, submissionId } = req.body;
    const user = req.user;
    
    console.log('Vote request:', { gameId, userId: user._id, submissionId });
    
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
    if (submission.player.toString() === user._id.toString() && !canVoteForSelf) {
      return res.status(400).json({ error: 'Cannot vote for your own submission in games with 3 or more players' });
    }
    
    // Check if player already voted
    const alreadyVoted = game.submissions.some(s => 
      s.votes.some(v => v.toString() === user._id.toString())
    );
    
    if (alreadyVoted) {
      // Remove previous vote
      game.submissions.forEach(s => {
        s.votes = s.votes.filter(v => v.toString() !== user._id.toString());
      });
    }
    
    // Add vote
    submission.votes.push(user._id);
    await game.save();
    
    // Check if all ACTIVE players have voted
    const totalVotes = game.submissions.reduce((acc, s) => acc + s.votes.length, 0);
    
    // If game was force-started, only count votes from active players
    const expectedVotesCount = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers.length 
      : game.players.length;
    
    console.log(`Expected votes: ${expectedVotesCount}, Current votes: ${totalVotes}`);
    const allVoted = totalVotes >= expectedVotesCount;
    
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
    await game.populate('submissions.player', 'displayName');
    await game.populate('submissions.votes', 'displayName');
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions,
      expectedVotes: expectedVotesCount,
      currentVotes: totalVotes
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
    
    // Reset active players to empty for the new round
    // This will be repopulated when players ready up or the host forces the start
    game.activePlayers = [];
    
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
    
    game.status = 'selecting';
    
    await game.save();
    
    res.json({
      gameId: game._id,
      status: game.status,
      currentQuestion: game.currentQuestion,
      activePlayers: []
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
    console.log('Getting game state for:', gameId, 'User:', req.user.displayName);
    
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
    
    await game.populate('host', 'displayName');
    await game.populate('players.user', 'displayName');
    await game.populate('submissions.player', 'displayName');
    await game.populate('submissions.votes', 'displayName');
    
    res.json({
      _id: game._id,
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players,
      currentQuestion: game.currentQuestion,
      submissions: game.submissions,
      activePlayers: game.activePlayers || []
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get random question preview
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

// Force start game (host only)
router.post('/start', async (req, res) => {
  try {
    const { gameId, userId, questionText, questionCategory } = req.body;
    console.log('Force starting game for gameId:', gameId, 'by host:', userId);
    
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

    // Create playlist
    const host = await User.findById(game.host);
    const playlist = await createPlaylist(
      host.accessToken,
      `Song Game - ${game.code}`,
      'Collaborative playlist for the song selection game'
    );
    
    game.playlistId = playlist.id;
    
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
    
    // Log active players for debugging
    console.log('Active players for this game:', {
      totalPlayers: game.players.length,
      readyPlayers: game.players.filter(player => player.isReady).length,
      activePlayers: game.activePlayers.length
    });
    
    // Start the game regardless of ready status
    game.status = 'selecting';
    await game.save();
    
    // Populate game data
    await game.populate('players.user', 'displayName profileImage');
    await game.populate('activePlayers', 'displayName profileImage');
    
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

module.exports = router;