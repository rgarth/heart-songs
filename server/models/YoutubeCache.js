// server/models/YoutubeCache.js
const mongoose = require('mongoose');

const YoutubeCacheSchema = new mongoose.Schema({
  // Compound key: artist + track name (normalized)
  trackKey: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Original track info from Last.fm
  artist: {
    type: String,
    required: true
  },
  
  track: {
    type: String,
    required: true
  },
  
  // Last.fm track ID (if available)
  lastfmId: String,
  
  // YouTube data
  youtubeId: {
    type: String,
    required: true
  },
  
  youtubeTitle: String,
  
  youtubeThumbnail: String,
  
  // Cache metadata
  firstSearched: {
    type: Date,
    default: Date.now
  },
  
  lastAccessed: {
    type: Date,
    default: Date.now,
    index: true // For efficient cleanup queries
  },
  
  accessCount: {
    type: Number,
    default: 1
  },
  
  // Optional: store additional metadata
  confidence: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  }
});

// Create a TTL index - automatically delete entries after X days of no access
YoutubeCacheSchema.index({ lastAccessed: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days

// Helper method to generate cache key
YoutubeCacheSchema.statics.generateKey = function(artist, track) {
  // Normalize the key: lowercase, remove special chars, trim whitespace
  const normalizedArtist = artist.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const normalizedTrack = track.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  return `${normalizedArtist}:${normalizedTrack}`;
};

// Instance method to update access info
YoutubeCacheSchema.methods.updateAccess = function() {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  return this.save();
};

// Pre-save hook to set trackKey
YoutubeCacheSchema.pre('save', function() {
  if (!this.trackKey) {
    this.trackKey = this.constructor.generateKey(this.artist, this.track);
  }
});

module.exports = mongoose.model('YoutubeCache', YoutubeCacheSchema);