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
    enum: ['waiting', 'selecting', 'voting', 'results'],
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
    votes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  playlistId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema);