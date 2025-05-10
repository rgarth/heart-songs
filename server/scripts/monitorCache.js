// server/scripts/monitorCache.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const youtubeCacheService = require('../services/youtubeCacheService');

// Load environment variables
dotenv.config();

async function monitorCache() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get current cache stats
    const stats = await youtubeCacheService.getCacheStats();
    
    console.log('\n=== YOUTUBE CACHE MONITOR ===');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Total entries: ${stats.totalEntries}`);
    console.log(`Entries with videos: ${stats.entriesWithVideos}`);
    console.log(`Entries without videos: ${stats.entriesWithoutVideos}`);
    
    // Calculate estimated storage usage
    const avgEntrySize = 500; // bytes (rough estimate)
    const totalSize = stats.totalEntries * avgEntrySize;
    console.log(`Estimated storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Check oldest and most accessed entries
    if (stats.oldestEntry) {
      console.log('\nOldest entry:');
      console.log(`- ${stats.oldestEntry.artist} - ${stats.oldestEntry.track}`);
      console.log(`- First searched: ${stats.oldestEntry.firstSearched}`);
    }
    
    if (stats.mostAccessed) {
      console.log('\nMost accessed entry:');
      console.log(`- ${stats.mostAccessed.artist} - ${stats.mostAccessed.track}`);
      console.log(`- Access count: ${stats.mostAccessed.accessCount}`);
    }
    
    // Get recent activity stats
    const YoutubeCache = require('../models/YoutubeCache');
    
    // Entries added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const addedToday = await YoutubeCache.countDocuments({
      firstSearched: { $gte: today }
    });
    
    // Entries accessed today
    const accessedToday = await YoutubeCache.countDocuments({
      lastAccessed: { $gte: today }
    });
    
    console.log('\nToday\'s activity:');
    console.log(`- New entries: ${addedToday}`);
    console.log(`- Entries accessed: ${accessedToday}`);
    
    // Check for quota exhaustion patterns
    const quotaExhaustedCount = await YoutubeCache.countDocuments({
      youtubeId: 'NOT_FOUND'
    });
    
    console.log(`\nEntries marked as "NOT_FOUND": ${quotaExhaustedCount}`);
    
    // Get cache hit ratio from the last 100 entries
    const recentEntries = await YoutubeCache.find()
      .sort({ lastAccessed: -1 })
      .limit(100);
    
    const uniqueAccesses = new Set(recentEntries.map(e => e.trackKey)).size;
    const totalAccesses = recentEntries.reduce((sum, e) => sum + e.accessCount, 0);
    const avgAccessPerEntry = totalAccesses / uniqueAccesses;
    
    console.log('\nRecent cache performance:');
    console.log(`- Average accesses per entry: ${avgAccessPerEntry.toFixed(2)}`);
    
    // Generate recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (stats.totalEntries > 50000) {
      console.log('- WARN: Cache is getting large (>50k entries). Consider cleanup.');
    }
    
    if (quotaExhaustedCount > stats.totalEntries * 0.2) {
      console.log('- WARN: High number of NOT_FOUND entries. May indicate quota issues.');
    }
    
    if (avgAccessPerEntry < 1.5) {
      console.log('- INFO: Low cache hit ratio. Most entries are accessed only once.');
    }
    
    if (addedToday > 1000) {
      console.log('- INFO: High cache growth today. Monitor for quota usage.');
    }
    
    console.log('\n=== END MONITOR ===\n');
    
  } catch (error) {
    console.error('Error during monitoring:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

// Check if we should run as a continuous monitor
const args = process.argv.slice(2);
if (args.includes('--continuous')) {
  const intervalMinutes = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 60;
  
  console.log(`Starting continuous monitoring (every ${intervalMinutes} minutes)...`);
  
  // Run immediately
  monitorCache();
  
  // Then run at intervals
  setInterval(monitorCache, intervalMinutes * 60 * 1000);
} else {
  // Run once
  monitorCache();
}