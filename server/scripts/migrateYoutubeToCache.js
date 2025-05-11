// server/scripts/migrateYoutubeToCache.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const youtubeCacheService = require('../services/youtubeCacheService');

// Load environment variables
dotenv.config();

async function migrateExistingData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all models
    const Game = require('../models/Game');
    const Playlist = require('../models/Playlist');
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('\n=== MIGRATING EXISTING YOUTUBE IDS TO CACHE ===\n');
    
    // 1. Migrate from active games
    console.log('1. Checking active games...');
    const activeGames = await Game.find({
      status: { $ne: 'ended' },
      $or: [
        { 'submissions.youtubeId': { $exists: true, $ne: null } },
        { 'previousRounds.submissions.youtubeId': { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`Found ${activeGames.length} active games with YouTube IDs`);
    
    for (const game of activeGames) {
      // Process current submissions
      if (game.submissions && game.submissions.length > 0) {
        for (const submission of game.submissions) {
          if (submission.youtubeId && submission.songId && submission.songName && submission.artist) {
            try {
              await youtubeCacheService.addToCacheManually(
                submission.artist,
                submission.songName,
                submission.youtubeId,
                {
                  confidence: 1, // These are manually verified submissions
                  lastfmId: submission.songId
                }
              );
              migratedCount++;
            } catch (error) {
              if (error.code === 11000) {
                // Duplicate key - already exists in cache, which is fine
                skippedCount++;
                console.log(`Already cached: ${submission.artist} - ${submission.songName}`);
              } else {
                errorCount++;
                console.error(`Error caching: ${submission.artist} - ${submission.songName}`, error.message);
              }
            }
          }
        }
      }
      
      // Process previous rounds
      if (game.previousRounds && game.previousRounds.length > 0) {
        for (const round of game.previousRounds) {
          if (round.submissions && round.submissions.length > 0) {
            for (const submission of round.submissions) {
              if (submission.youtubeId && submission.songId && submission.songName && submission.artist) {
                try {
                  await youtubeCacheService.addToCacheManually(
                    submission.artist,
                    submission.songName,
                    submission.youtubeId,
                    {
                      confidence: 1,
                      lastfmId: submission.songId
                    }
                  );
                  migratedCount++;
                } catch (error) {
                  if (error.code === 11000) {
                    // Duplicate key - already exists in cache, which is fine
                    skippedCount++;
                    console.log(`Already cached: ${submission.artist} - ${submission.songName}`);
                  } else {
                    errorCount++;
                    console.error(`Error caching: ${submission.artist} - ${submission.songName}`, error.message);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`\nMigrated ${migratedCount} YouTube IDs to cache from active games`);
    console.log(`Skipped ${skippedCount} already cached entries`);
    console.log(`Encountered ${errorCount} errors`);
    
    // 2. Clean up YouTube IDs from Game model
    console.log('\n2. Cleaning up YouTube IDs from Game model...');
    
    try {
      const gameUpdateResult = await Game.updateMany(
        {},
        {
          $unset: {
            'submissions.$[].youtubeId': '',
            'submissions.$[].youtubeTitle': '',
            'previousRounds.$[].submissions.$[].youtubeId': '',
            'previousRounds.$[].submissions.$[].youtubeTitle': ''
          }
        }
      );
      
      console.log(`Updated ${gameUpdateResult.modifiedCount} game documents`);
    } catch (updateError) {
      console.error('Error updating game documents:', updateError);
    }
    
    // 3. Clean up YouTube IDs from Playlist model
    console.log('\n3. Cleaning up YouTube IDs from Playlist model...');
    
    try {
      const playlistUpdateResult = await Playlist.updateMany(
        {},
        {
          $unset: {
            'tracks.$[].youtubeId': ''
          }
        }
      );
      
      console.log(`Updated ${playlistUpdateResult.modifiedCount} playlist documents`);
    } catch (updateError) {
      console.error('Error updating playlist documents:', updateError);
    }
    
    // 4. Show final cache stats
    console.log('\n=== FINAL CACHE STATISTICS ===');
    const cacheStats = await youtubeCacheService.getCacheStats();
    console.log(`Total cache entries: ${cacheStats.totalEntries}`);
    console.log(`Entries with videos: ${cacheStats.entriesWithVideos}`);
    console.log(`Entries without videos: ${cacheStats.entriesWithoutVideos}`);
    
    console.log('\n=== MIGRATION COMPLETE ===');
    console.log('All existing YouTube IDs have been moved to the cache.');
    console.log('Game and Playlist models are now leaner and more efficient.');
    console.log(`Total migrated: ${migratedCount}`);
    console.log(`Total skipped (already cached): ${skippedCount}`);
    console.log(`Total errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the migration
migrateExistingData();