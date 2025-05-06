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
    // Use the authenticated user from the middleware
    const host = req.user;
    
    if (!host) {
      console.error('Authentication middleware did not attach user to request');
      return res.status(401).json({ error: 'User authentication failed' });
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
    res.status(500).json({ error: 'Failed to create game', details: error.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { gameCode } = req.body;
    const user = req.user;
    
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
      playerAdded = true;
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
      if (game.players.length > 1) {
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
    
    // Check if user already submitted
    const existingSubmission = game.submissions.find(s => s.player && s.player.toString() === user._id.toString());
    
    // Check if this is the first submission (fastest player)
    const isFirstSubmission = game.submissions.length === 0;

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.songId = songId;
      existingSubmission.songName = songName;
      existingSubmission.artist = artist;
      existingSubmission.albumCover = albumCover;
      existingSubmission.submittedAt = new Date(); // Update submission time
    } else {
      // Create new submission with timestamp and speed bonus if first
      game.submissions.push({
        player: user._id,
        songId,
        songName,
        artist,
        albumCover,
        submittedAt: new Date(),
        gotSpeedBonus: isFirstSubmission, // Award speed bonus to first submission
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

// Vote for a song
router.post('/vote', async (req, res) => {
  try {
    const { gameId, submissionId } = req.body;
    const user = req.user;
    
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
    
    const allVoted = totalVotes >= expectedVotesCount;
    
    if (allVoted) {
      game.status = 'results';
      
      // Update scores
      game.submissions.forEach(sub => {
        // Base points from votes
        const votePoints = sub.votes.length;
        
        // Add speed bonus point if applicable
        const speedBonus = sub.gotSpeedBonus ? 1 : 0;
        
        // Calculate total points for this submission
        const totalPoints = votePoints + speedBonus;
        
        if (totalPoints > 0) {
          const playerIndex = game.players.findIndex(p => p.user.toString() === sub.player.toString());
          if (playerIndex !== -1) {
            game.players[playerIndex].score += totalPoints;
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

    // Create playlist in our database (removed external Spotify playlist creation)
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
      console.error('Error creating playlist:', playlistError);
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

// End game (host only)
router.post('/end', async (req, res) => {
  try {
    const { gameId } = req.body;
    // Important: Use req.user provided by the middleware instead of finding by userId
    const user = req.user;
    
    if (!user) {
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
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can end the game' });
    }
    
    // Change game status to ended and set the end timestamp
    game.status = 'ended';
    game.endedAt = new Date();
    
    await game.save();
    
    // Get all tracks from playlist for this game
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
    
    res.json({
      _id: game._id,
      gameId: game._id,
      gameCode: game.code,
      status: game.status,
      host: game.host,
      players: game.players,
      playlist: playlist ? playlist.tracks : [],
      endedAt: game.endedAt
    });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

module.exports = router;