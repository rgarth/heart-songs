// server/models/YoutubeCache.js - Updated to store both audio and video
const mongoose = require('mongoose');

const YoutubeCacheSchema = new mongoose.Schema({
  // Single key for the song (artist + track)
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
  
  // Audio version data
  audio: {
    youtubeId: String,
    youtubeTitle: String,
    youtubeThumbnail: String,
    confidence: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    firstSearched: {
      type: Date,
      default: Date.now
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  
  // Video version data
  video: {
    youtubeId: String,
    youtubeTitle: String,
    youtubeThumbnail: String,
    confidence: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    firstSearched: {
      type: Date,
      default: Date.now
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  
  // Cache metadata
  createdAt: {
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
  }
});

// Create a TTL index - automatically delete entries after X days of no access
YoutubeCacheSchema.index({ lastAccessed: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days

// Helper method to generate cache key (no preference needed)
YoutubeCacheSchema.statics.generateKey = function(artist, track) {
  // Normalize the key: lowercase, remove special chars, trim whitespace
  const normalizedArtist = artist.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const normalizedTrack = track.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  return `${normalizedArtist}:${normalizedTrack}`;
};

// Instance method to update access info
YoutubeCacheSchema.methods.updateAccess = function(preferVideo = false) {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  
  // Update specific preference access time
  if (preferVideo && this.video.youtubeId) {
    this.video.lastAccessed = new Date();
  } else if (!preferVideo && this.audio.youtubeId) {
    this.audio.lastAccessed = new Date();
  }
  
  return this.save();
};

// Pre-save hook to set trackKey
YoutubeCacheSchema.pre('save', function() {
  if (!this.trackKey) {
    this.trackKey = this.constructor.generateKey(this.artist, this.track);
  }
});

module.exports = mongoose.model('YoutubeCache', YoutubeCacheSchema);