// server/models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'selecting', 'voting', 'results', 'ended'],
    default: 'waiting'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isReady: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  // New field to track players who are actively participating in the current round
  activePlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentQuestion: {
    text: String,
    category: String
  },
  submissions: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    songId: String,
    songName: String,
    artist: String,
    albumCover: String,
    youtubeId: String, // Added for YouTube integration
    submittedAt: { // Add timestamp tracking
      type: Date,
      default: Date.now
    },
    gotSpeedBonus: { // Flag for the speed bonus
      type: Boolean,
      default: false
    },
    votes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  previousRounds: [{
    question: {
      text: String,
      category: String
    },
    submissions: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      songId: String,
      songName: String,
      artist: String,
      albumCover: String,
      youtubeId: String, // Added for YouTube
      gotSpeedBonus: Boolean,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }]
  }],
  playlistId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default 7 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  }
});

module.exports = mongoose.model('Game', GameSchema);