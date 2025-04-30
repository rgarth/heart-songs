// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  profileImage: String,
  score: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);