// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // For Spotify auth (no longer used)
  // Completely removed the unique constraint
  spotifyId: {
    type: String
  },
  // For anonymous users - this is the primary identifier now
  anonId: {
    type: String,
    sparse: true,
    unique: true
  },
  // Common fields
  displayName: {
    type: String,
    required: true
  },
  email: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tokenExpiry: Date,
  profileImage: String,
  score: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // TTL index to auto-delete anonymous users after expiry
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

// Create a TTL index on expiresAt
UserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create a unique index on the displayName for username uniqueness
UserSchema.index({ displayName: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);