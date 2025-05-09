// server/models/Playlist.js - Updated for YouTube integration
const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true
  },
  tracks: [{
    trackId: {
      type: String,
      required: true
    },
    trackName: {
      type: String,
      required: true
    },
    artistName: {
      type: String,
      required: true
    },
    albumCover: String,
    youtubeId: String, // Add YouTube video ID
    addedAt: {
      type: Date,
      default: Date.now
    },
    // Reference to the round/question this track was for
    roundNumber: Number,
    questionText: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  // TTL index to auto-delete playlists after games are over
  expiresAt: {
    type: Date,
    default: function() {
      // Default 48 hours from creation
      const date = new Date();
      date.setHours(date.getHours() + 48);
      return date;
    },
    expires: 0 // Use MongoDB TTL to automatically delete expired documents
  }
});

// Create a TTL index on expiresAt
PlaylistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Playlist', PlaylistSchema);