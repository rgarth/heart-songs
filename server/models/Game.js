// server/models/Game.js - Updated with TTL, inactivity tracking, and round limits
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'selecting', 'voting', 'results', 'question-selection', 'ended'],
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
  
  // Track players who are actively participating in the current round
  activePlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Track questions that have already been used in this game
  usedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    roundNumber: Number,
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  currentQuestion: {
    _id: mongoose.Schema.Types.ObjectId,
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
      enum: [null, 'selection', 'voting'],
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
      _id: mongoose.Schema.Types.ObjectId,
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
  
  // NEW: Round limit enforcement
  maxRounds: {
    type: Number,
    default: 30,
    max: 30
  },
  
  // NEW: Activity tracking for auto-end
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true // For efficient queries
  },
  
  // NEW: State duration tracking for 15-minute limit
  stateHistory: [{
    state: {
      type: String,
      enum: ['waiting', 'selecting', 'voting', 'results', 'question-selection', 'ended']
    },
    enteredAt: {
      type: Date,
      default: Date.now
    },
    exitedAt: Date,
    durationMinutes: Number
  }],
  
  // Current state start time for tracking
  currentStateStartedAt: {
    type: Date,
    default: Date.now,
    index: true // For cleanup queries
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  endedAt: {
    type: Date,
    default: null
  },
  
  // UPDATED: Set TTL at creation and never change it
  expiresAt: {
    type: Date,
    default: function() {
      // Hard limit: 24 hours from creation (regardless of activity)
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    },
    expires: 0 // MongoDB TTL
  },

  winnerSelectedQuestion: {
    text: String,
    category: String,
    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    selectedAt: Date
  }
});

// TTL index for automatic cleanup after 24 hours
GameSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding stale games by state duration
GameSchema.index({ currentStateStartedAt: 1, status: 1 });

// Index for finding inactive games
GameSchema.index({ lastActivity: 1, status: 1 });

// PRE-SAVE MIDDLEWARE: Track state changes and update activity
GameSchema.pre('save', function(next) {
  const game = this;
  
  // Update last activity timestamp
  game.lastActivity = new Date();
  
  // Track state changes
  if (game.isModified('status')) {
    // Close previous state in history
    if (game.stateHistory.length > 0) {
      const lastState = game.stateHistory[game.stateHistory.length - 1];
      if (!lastState.exitedAt) {
        lastState.exitedAt = new Date();
        lastState.durationMinutes = Math.floor((lastState.exitedAt - lastState.enteredAt) / 60000);
      }
    }
    
    // Add new state to history
    game.stateHistory.push({
      state: game.status,
      enteredAt: new Date()
    });
    
    // Reset state start time
    game.currentStateStartedAt = new Date();
    
    console.log(`Game ${game.code}: State changed to ${game.status}`);
  }
  
  next();
});

// INSTANCE METHOD: Check if game should be auto-ended for inactivity
GameSchema.methods.shouldAutoEnd = function() {
  const now = new Date();
  const stateAge = now - this.currentStateStartedAt;
  const inactivityAge = now - this.lastActivity;
  
  // 15 minutes in current state
  const STATE_LIMIT = 15 * 60 * 1000;
  
  // 30 minutes of total inactivity
  const INACTIVITY_LIMIT = 30 * 60 * 1000;
  
  // Maximum rounds reached
  const roundsPlayed = this.previousRounds ? this.previousRounds.length : 0;
  
  return {
    shouldEnd: stateAge > STATE_LIMIT || inactivityAge > INACTIVITY_LIMIT || roundsPlayed >= this.maxRounds,
    reason: stateAge > STATE_LIMIT ? 'state_timeout' : 
            inactivityAge > INACTIVITY_LIMIT ? 'inactivity' : 
            roundsPlayed >= this.maxRounds ? 'max_rounds' : null,
    stateMinutes: Math.floor(stateAge / 60000),
    inactivityMinutes: Math.floor(inactivityAge / 60000),
    roundsPlayed: roundsPlayed
  };
};

// STATIC METHOD: Find games that need auto-ending
GameSchema.statics.findGamesNeedingAutoEnd = function() {
  const fifteenMinutesAgo = new Date(Date.now() - (15 * 60 * 1000));
  const thirtyMinutesAgo = new Date(Date.now() - (30 * 60 * 1000));
  
  return this.find({
    $and: [
      { status: { $ne: 'ended' } },
      {
        $or: [
          // Games stuck in a state for 15+ minutes
          { currentStateStartedAt: { $lt: fifteenMinutesAgo } },
          // Games with no activity for 30+ minutes
          { lastActivity: { $lt: thirtyMinutesAgo } }
        ]
      }
    ]
  });
};

module.exports = mongoose.model('Game', GameSchema);