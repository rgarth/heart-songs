// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // For Spotify auth (legacy, not used in anonymous version)
  spotifyId: {
    type: String,
    sparse: true,
    unique: true
  },
  // For anonymous users
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
    },
    expires: 0 // Use MongoDB TTL to automatically delete expired documents
  }
});

// Create a TTL index on expiresAt - only applies to anonymous users
UserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('User', UserSchema);