// server/scripts/cleanupCache.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const youtubeCacheService = require('../services/youtubeCacheService');

// Load environment variables
dotenv.config();

async function runCleanup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get current stats
    console.log('\n=== BEFORE CLEANUP ===');
    const beforeStats = await youtubeCacheService.getCacheStats();
    console.log('Total entries:', beforeStats.totalEntries);
    console.log('Entries with videos:', beforeStats.entriesWithVideos);
    console.log('Entries without videos:', beforeStats.entriesWithoutVideos);
    
    // Run cleanup with different options based on arguments
    const args = process.argv.slice(2);
    let options = {
      olderThan: 90, // days
      maxEntries: 10000,
      minConfidence: 0.3
    };
    
    // Parse arguments
    if (args.includes('--aggressive')) {
      options.olderThan = 30;
      options.maxEntries = 5000;
      options.minConfidence = 0.5;
      console.log('\nRunning AGGRESSIVE cleanup...');
    } else if (args.includes('--light')) {
      options.olderThan = 180;
      options.maxEntries = 20000;
      options.minConfidence = 0.1;
      console.log('\nRunning LIGHT cleanup...');
    } else {
      console.log('\nRunning STANDARD cleanup...');
    }
    
    console.log('Options:', options);
    
    // Perform cleanup
    const deletedCount = await youtubeCacheService.cleanupCache(options);
    console.log(`\nDeleted ${deletedCount} entries`);
    
    // Get after stats
    console.log('\n=== AFTER CLEANUP ===');
    const afterStats = await youtubeCacheService.getCacheStats();
    console.log('Total entries:', afterStats.totalEntries);
    console.log('Entries with videos:', afterStats.entriesWithVideos);
    console.log('Entries without videos:', afterStats.entriesWithoutVideos);
    
    // Calculate space saved (rough estimate)
    const avgEntrySize = 500; // bytes (rough estimate)
    const spaceSaved = deletedCount * avgEntrySize;
    console.log(`\nEstimated space saved: ${(spaceSaved / 1024 / 1024).toFixed(2)} MB`);
    
    // Show most accessed entries
    console.log('\n=== TOP 5 MOST ACCESSED ===');
    const YoutubeCache = require('../models/YoutubeCache');
    const topEntries = await YoutubeCache.find()
      .sort({ accessCount: -1 })
      .limit(5)
      .select('artist track accessCount lastAccessed');
    
    topEntries.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.artist} - ${entry.track} (${entry.accessCount} accesses)`);
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
runCleanup();``