// server/routes/game.js - Updated to remove YouTube data during submission

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const Question = require('../models/Question');
const Playlist = require('../models/Playlist');
const { authenticateUser } = require('../middleware/auth');
const { saveTrackToPlaylist, getPlaylistTracks } = require('../services/playlistService');

// Apply authentication middleware to all game routes
router.use(authenticateUser);

// Generate a random game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get random question that hasn't been used in this game
async function getRandomQuestion(gameId = null) {
  try {
    // If no gameId provided, just get any random question
    if (!gameId) {
      const randomQuestions = await Question.aggregate([
        { $sample: { size: 1 } }
      ]);
      
      if (!randomQuestions || randomQuestions.length === 0) {
        const count = await Question.countDocuments();
        const random = Math.floor(Math.random() * count);
        return Question.findOne().skip(random);
      }
      
      return randomQuestions[0];
    }
    
    // Get the game to check used questions
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
      game = await Game.findById(gameId);
    }
    
    if (!game) {
      game = await Game.findOne({ code: gameId });
    }
    
    if (!game) {
      console.error('Game not found for question selection:', gameId);
      // Fallback to any random question
      return await Question.aggregate([{ $sample: { size: 1 } }]).then(q => q[0]);
    }
    
    // Get list of used question IDs
    const usedQuestionIds = (game.usedQuestions || []).map(q => q.questionId);
    
    // Build aggregation pipeline to exclude used questions
    const pipeline = [
      {
        $match: {
          _id: { $nin: usedQuestionIds }
        }
      },
      { $sample: { size: 1 } }
    ];
    
    const randomQuestions = await Question.aggregate(pipeline);
    
    // If all questions have been used, get a random one anyway (rare edge case)
    if (!randomQuestions || randomQuestions.length === 0) {
      console.warn(`All questions used in game ${gameId}, selecting any random question`);
      return await Question.aggregate([{ $sample: { size: 1 } }]).then(q => q[0]);
    }
    
    return randomQuestions[0];
  } catch (error) {
    console.error('Error getting random question:', error);
    // Fallback to any random question
    return await Question.aggregate([{ $sample: { size: 1 } }]).then(q => q[0]);
  }
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

// Toggle ready status - UPDATED to track question usage
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
        
        // Get random question that hasn't been used
        const question = await getRandomQuestion(game._id);
        game.currentQuestion = {
          _id: question._id,
          text: question.text,
          category: question.category
        };
        
        // Track this question as used
        if (!game.usedQuestions) {
          game.usedQuestions = [];
        }
        game.usedQuestions.push({
          questionId: question._id,
          roundNumber: (game.previousRounds?.length || 0) + 1,
          usedAt: new Date()
        });
        
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

// UPDATED: Submit route with pass support
router.post('/submit', async (req, res) => {
  try {
    const { gameId, userId, songId, songName, artist, albumCover, hasPassed } = req.body;
    
    // Validate required parameters
    if (!gameId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { gameId }
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
    
    // Check if this is the first submission (fastest player) - only for actual song submissions
    const isFirstSubmission = game.submissions.length === 0 && !hasPassed;

    // Create submission data
    const submissionData = {
      player: userId,
      hasPassed: hasPassed || false,
      submittedAt: new Date(),
      gotSpeedBonus: isFirstSubmission,
      votes: []
    };

    if (hasPassed) {
      // For passed submissions, use placeholder values
      submissionData.songId = 'PASS';
      submissionData.songName = 'PASS';
      submissionData.artist = 'PASS';
      submissionData.albumCover = '';
      submissionData.youtubeId = null;
    } else {
      // For actual song submissions
      submissionData.songId = songId;
      submissionData.songName = songName;
      submissionData.artist = artist;
      submissionData.albumCover = albumCover;
      // No YouTube data is stored during submission
    }

    if (existingSubmission) {
      // Update existing submission
      Object.assign(existingSubmission, submissionData);
      existingSubmission.submittedAt = new Date(); // Update submission time
    } else {
      // Create new submission
      game.submissions.push(submissionData);
    }
    
    // Add track to our playlist database (only for actual song submissions, not passes)
    if (!hasPassed) {
      try {
        await saveTrackToPlaylist(
          game._id.toString(), 
          songId, 
          songName, 
          artist, 
          albumCover || '',
          null // No YouTube ID during submission
        );
      } catch (playlistError) {
        console.error('Error adding track to playlist:', playlistError);
        // Continue even if there's an error with the playlist
      }
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
      gotSpeedBonus: isFirstSubmission,
      hasPassed: hasPassed || false
    });

  } catch (error) {
    console.error('Error submitting song:', error);
    res.status(500).json({ error: 'Failed to submit song', details: error.message });
  }
});

// Vote for a song - Updated to correctly handle pass submissions
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
    
    // Cannot vote for passed submissions
    if (submission.hasPassed) {
      return res.status(400).json({ error: 'Cannot vote for passed submissions' });
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
    
    // Count active players - these are ALL players who are participating in the current round
    const activePlayers = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers 
      : game.players.map(p => p.user);
    
    // BUGFIX: All active players can vote, regardless of whether they passed or not
    // The key insight is that passing affects submission, not voting eligibility
    const expectedVotesCount = activePlayers.length;
    
    // Count passed submissions for informational purposes
    const passedSubmissions = game.submissions.filter(s => s.hasPassed);
    const passedPlayerCount = passedSubmissions.length;
    
    // Check if all active players have voted
    const allVoted = totalVotes >= expectedVotesCount;
    
    if (allVoted) {
      game.status = 'results';
      
      // Update scores - only for non-passed submissions
      game.submissions.forEach(sub => {
        // Skip passed submissions for scoring
        if (sub.hasPassed) return;
        
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
      currentVotes: totalVotes,
      passedCount: passedPlayerCount
    });
  } catch (error) {
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Start a new round - UPDATED to track question usage
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
    
    // Save current round data to previous rounds before clearing
    const currentRoundData = {
      question: {
        _id: game.currentQuestion._id,
        text: game.currentQuestion.text,
        category: game.currentQuestion.category
      },
      submissions: [...game.submissions],
      playersWhoFailedToSubmit: game.currentRound?.playersWhoFailedToSubmit || [],
      playersWhoFailedToVote: game.currentRound?.playersWhoFailedToVote || []
    };
    
    // Add to previous rounds
    if (!game.previousRounds) {
      game.previousRounds = [];
    }
    game.previousRounds.push(currentRoundData);
    
    // Clear submissions
    game.submissions = [];
    
    // Reset ready status
    game.players.forEach(player => {
      player.isReady = false;
    });
    
    // Reset active players to empty for the new round
    game.activePlayers = [];
    
    // Reset current round failure tracking
    game.currentRound = {
      playersWhoFailedToSubmit: [],
      playersWhoFailedToVote: []
    };
    
    // Set question - either use provided question or get a random one
    if (questionText && questionCategory) {
      // Use the provided question (custom questions don't need tracking)
      game.currentQuestion = {
        text: questionText,
        category: questionCategory
      };
    } else {
      // Get new random question that hasn't been used
      const question = await getRandomQuestion(game._id);
      game.currentQuestion = {
        _id: question._id,
        text: question.text,
        category: question.category
      };
      
      // Track this question as used
      if (!game.usedQuestions) {
        game.usedQuestions = [];
      }
      game.usedQuestions.push({
        questionId: question._id,
        roundNumber: game.previousRounds.length + 1,
        usedAt: new Date()
      });
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
      activePlayers: game.activePlayers || [],
      countdown: game.countdown
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get random question preview - UPDATED to use game context
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
    
    // Get random question that hasn't been used in this game (but don't save it to the game yet)
    const question = await getRandomQuestion(gameId);
    
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

// Force start game - UPDATED to track question usage
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
      // Use the provided question (custom questions don't need tracking)
      game.currentQuestion = {
        text: questionText,
        category: questionCategory
      };
    } else {
      // Get random question that hasn't been used
      const question = await getRandomQuestion(game._id);
      game.currentQuestion = {
        _id: question._id,
        text: question.text,
        category: question.category
      };
      
      // Track this question as used
      if (!game.usedQuestions) {
        game.usedQuestions = [];
      }
      game.usedQuestions.push({
        questionId: question._id,
        roundNumber: (game.previousRounds?.length || 0) + 1,
        usedAt: new Date()
      });
    }

    // Auto-ready the host if they're not already ready
    const hostPlayerIndex = game.players.findIndex(p => p.user.toString() === userId);
    if (hostPlayerIndex !== -1 && !game.players[hostPlayerIndex].isReady) {
      game.players[hostPlayerIndex].isReady = true;
    }
    
    // Make sure all ready players are added to activePlayers
    game.activePlayers = game.players
      .filter(player => player.isReady)
      .map(player => player.user);
    
    // Initialize currentRound tracking
    game.currentRound = {
      playersWhoFailedToSubmit: [],
      playersWhoFailedToVote: []
    };
    
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

// Add route to get playlist tracks
router.get('/playlist/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const tracks = await getPlaylistTracks(gameId);
    res.json(tracks);
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    res.status(500).json({ error: 'Failed to get playlist tracks' });
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

// Force end selection phase 
router.post('/end-selection', async (req, res) => {
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
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can end the selection phase' });
    }
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selection phase' });
    }
    
    // Initialize currentRound if it doesn't exist
    if (!game.currentRound) {
      game.currentRound = {
        playersWhoFailedToSubmit: [],
        playersWhoFailedToVote: []
      };
    }
    
    // Get all active players who should have submitted
    const expectedSubmitters = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers 
      : game.players.map(p => p.user);
    
    // Get players who actually submitted
    const submittedPlayerIds = game.submissions.map(s => s.player.toString());
    
    // Find players who didn't submit
    const playersWhoDidntSubmit = expectedSubmitters.filter(playerId => 
      !submittedPlayerIds.includes(playerId.toString())
    );
    
    // Create pass submissions for players who didn't submit
    for (const playerId of playersWhoDidntSubmit) {
      game.submissions.push({
        player: playerId,
        songId: 'PASS',
        songName: 'PASS',
        artist: 'PASS',
        albumCover: '',
        youtubeId: null,
        hasPassed: true,
        submittedAt: new Date(),
        gotSpeedBonus: false,
        votes: []
      });
    }
    
    // Track who failed to submit
    game.currentRound.playersWhoFailedToSubmit = playersWhoDidntSubmit;
    
    // Move to voting phase
    game.status = 'voting';
    await game.save();
    
    // Populate the failure list
    await game.populate('currentRound.playersWhoFailedToSubmit', 'displayName');
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions,
      playersWhoFailedToSubmit: game.currentRound.playersWhoFailedToSubmit
    });
  } catch (error) {
    console.error('Error ending selection phase:', error);
    res.status(500).json({ error: 'Failed to end selection phase' });
  }
});

// Force end voting phase
router.post('/end-voting', async (req, res) => {
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
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can end the voting phase' });
    }
    
    if (game.status !== 'voting') {
      return res.status(400).json({ error: 'Game is not in voting phase' });
    }
    
    // Initialize currentRound if it doesn't exist
    if (!game.currentRound) {
      game.currentRound = {
        playersWhoFailedToSubmit: [],
        playersWhoFailedToVote: []
      };
    }
    
    // Get all active players who should have voted
    const expectedVoters = game.activePlayers && game.activePlayers.length > 0 
      ? game.activePlayers 
      : game.players.map(p => p.user);
    
    // Get players who actually voted
    const votedPlayerIds = [];
    game.submissions.forEach(submission => {
      submission.votes.forEach(vote => {
        if (!votedPlayerIds.includes(vote.toString())) {
          votedPlayerIds.push(vote.toString());
        }
      });
    });
    
    // Find players who didn't vote
    const playersWhoDidntVote = expectedVoters.filter(playerId => 
      !votedPlayerIds.includes(playerId.toString())
    );
    
    // Track who failed to vote
    game.currentRound.playersWhoFailedToVote = playersWhoDidntVote;
    
    // Move to results phase
    game.status = 'results';
    
    // Update scores - only for non-passed submissions
    game.submissions.forEach(sub => {
      // Skip passed submissions for scoring
      if (sub.hasPassed) return;
      
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
    
    // Populate the failure lists
    await game.populate('currentRound.playersWhoFailedToSubmit', 'displayName');
    await game.populate('currentRound.playersWhoFailedToVote', 'displayName');
    await game.populate('submissions.player', 'displayName');
    await game.populate('submissions.votes', 'displayName');
    
    res.json({
      gameId: game._id,
      status: game.status,
      submissions: game.submissions,
      currentRound: game.currentRound
    });
  } catch (error) {
    console.error('Error ending voting phase:', error);
    res.status(500).json({ error: 'Failed to end voting phase' });
  }
});

// Start countdown for ending selection
router.post('/start-end-selection-countdown', async (req, res) => {

  try {
    const { gameId } = req.body;
    const user = req.user;
    
    // Find game by _id or code
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {;
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
      return res.status(403).json({ error: 'Only the host can start the countdown' });
    }
    
    if (game.status !== 'selecting') {
      return res.status(400).json({ error: 'Game is not in selection phase' });
    }
   
    // Start the countdown
    game.countdown = {
      isActive: true,
      type: 'selection',
      message: 'Selection phase ending in...',
      startedAt: new Date(),
      duration: 10
    };
    await game.save();

    // Schedule the actual ending after 10 seconds
    setTimeout(async () => {
      try {
       // Re-fetch the game to make sure it still exists and is in the right state
        const currentGame = await Game.findById(game._id);
    
        if (currentGame && currentGame.status === 'selecting' && currentGame.countdown.isActive) {
          // End selection using the existing logic
          await endSelectionInternal(currentGame);
    
        }
      } catch (error) {
        console.error('Error ending selection after countdown:', error);
      }
    }, 10000);
    res.json({
      gameId: game._id,
      status: game.status,
      countdown: game.countdown
    });
  } catch (error) {
    console.error('Error starting end selection countdown:', error);
    res.status(500).json({ error: 'Failed to start countdown' });
  }
});

// Start countdown for ending voting
router.post('/start-end-voting-countdown', async (req, res) => {
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
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can start the countdown' });
    }
    
    if (game.status !== 'voting') {
      return res.status(400).json({ error: 'Game is not in voting phase' });
    }
    
    // Start the countdown
    game.countdown = {
      isActive: true,
      type: 'voting',
      message: 'Voting phase ending in...',
      startedAt: new Date(),
      duration: 10
    };
    
    await game.save();
    
    // Schedule the actual ending after 10 seconds
    setTimeout(async () => {
      try {
        // Re-fetch the game to make sure it still exists and is in the right state
        const currentGame = await Game.findById(game._id);
        if (currentGame && currentGame.status === 'voting' && currentGame.countdown.isActive) {
          // End voting using the existing logic
          await endVotingInternal(currentGame);
        }
      } catch (error) {
        console.error('Error ending voting after countdown:', error);
      }
    }, 10000);
    
    res.json({
      gameId: game._id,
      status: game.status,
      countdown: game.countdown
    });
  } catch (error) {
    console.error('Error starting end voting countdown:', error);
    res.status(500).json({ error: 'Failed to start countdown' });
  }
});

// Cancel countdown (for host)
router.post('/cancel-countdown', async (req, res) => {
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
    
    // Check if user is the host
    if (game.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the host can cancel the countdown' });
    }
    
    // Cancel the countdown
    game.countdown = {
      isActive: false,
      type: null,
      message: '',
      startedAt: null,
      duration: 10
    };
    
    await game.save();
    
    res.json({
      gameId: game._id,
      status: game.status,
      countdown: game.countdown
    });
  } catch (error) {
    console.error('Error canceling countdown:', error);
    res.status(500).json({ error: 'Failed to cancel countdown' });
  }
});

// Helper function to end selection (extracted from the original route)
async function endSelectionInternal(game) {
  // Initialize currentRound if it doesn't exist
  if (!game.currentRound) {
    game.currentRound = {
      playersWhoFailedToSubmit: [],
      playersWhoFailedToVote: []
    };
  }
  
  // Get all active players who should have submitted
  const expectedSubmitters = game.activePlayers && game.activePlayers.length > 0 
    ? game.activePlayers 
    : game.players.map(p => p.user);
  
  // Get players who actually submitted
  const submittedPlayerIds = game.submissions.map(s => s.player.toString());
  
  // Find players who didn't submit
  const playersWhoDidntSubmit = expectedSubmitters.filter(playerId => 
    !submittedPlayerIds.includes(playerId.toString())
  );
  
  // Create pass submissions for players who didn't submit
  for (const playerId of playersWhoDidntSubmit) {
    game.submissions.push({
      player: playerId,
      songId: 'PASS',
      songName: 'PASS',
      artist: 'PASS',
      albumCover: '',
      youtubeId: null,
      hasPassed: true,
      submittedAt: new Date(),
      gotSpeedBonus: false,
      votes: []
    });
  }
  
  // Track who failed to submit
  game.currentRound.playersWhoFailedToSubmit = playersWhoDidntSubmit;
  
  // Clear the countdown
  game.countdown = {
    isActive: false,
    type: null,
    message: '',
    startedAt: null,
    duration: 10
  };
  
  // Move to voting phase
  game.status = 'voting';
  await game.save();
}

// Helper function to end voting (extracted from the original route)
async function endVotingInternal(game) {
  // Initialize currentRound if it doesn't exist
  if (!game.currentRound) {
    game.currentRound = {
      playersWhoFailedToSubmit: [],
      playersWhoFailedToVote: []
    };
  }
  
  // Get all active players who should have voted
  const expectedVoters = game.activePlayers && game.activePlayers.length > 0 
    ? game.activePlayers 
    : game.players.map(p => p.user);
  
  // Get players who actually voted
  const votedPlayerIds = [];
  game.submissions.forEach(submission => {
    submission.votes.forEach(vote => {
      if (!votedPlayerIds.includes(vote.toString())) {
        votedPlayerIds.push(vote.toString());
      }
    });
  });
  
  // Find players who didn't vote
  const playersWhoDidntVote = expectedVoters.filter(playerId => 
    !votedPlayerIds.includes(playerId.toString())
  );
  
  // Track who failed to vote
  game.currentRound.playersWhoFailedToVote = playersWhoDidntVote;
  
  // Clear the countdown
  game.countdown = {
    isActive: false,
    type: null,
    message: '',
    startedAt: null,
    duration: 10
  };
  
  // Move to results phase
  game.status = 'results';
  
  // Update scores - only for non-passed submissions
  game.submissions.forEach(sub => {
    // Skip passed submissions for scoring
    if (sub.hasPassed) return;
    
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

// Export the router
module.exports = router;