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
  countdown: {
    isActive: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: [null, 'selection', 'voting'], // Allow null as a valid value
      default: null
    },
    message: {
      type: String,
      default: ''
    },
    startedAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: 10 // seconds
    }
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
    // YouTube data - now included during submission
    youtubeId: String,
    isVideo: {
      type: Boolean,
      default: false
    },
    preferredType: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio'
    },
    // Pass indicator
    hasPassed: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    gotSpeedBonus: {
      type: Boolean,
      default: false
    },
    votes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  // Track round failures
  currentRound: {
    playersWhoFailedToSubmit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    playersWhoFailedToVote: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
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
      // YouTube data preserved in previous rounds
      youtubeId: String,
      isVideo: {
        type: Boolean,
        default: false
      },
      preferredType: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio'
      },
      // Pass indicator for previous rounds
      hasPassed: {
        type: Boolean,
        default: false
      },
      gotSpeedBonus: Boolean,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    // Track failures for each round
    playersWhoFailedToSubmit: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    playersWhoFailedToVote: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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