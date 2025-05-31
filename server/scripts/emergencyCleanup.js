// server/scripts/emergencyCleanup.js - Manual cleanup for existing zombies
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Game = require('../models/Game');
const User = require('../models/User');

// Load environment variables
dotenv.config();

class EmergencyCleanup {
  async connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  }

  async cleanupZombieGames() {
    console.log('\n🧹 CLEANING UP ZOMBIE GAMES...\n');
    
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - (15 * 60 * 1000));
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Find different types of zombie games
    const queries = [
      {
        name: 'Games stuck in states for 15+ minutes',
        query: {
          status: { $ne: 'ended' },
          currentStateStartedAt: { $lt: fifteenMinutesAgo }
        }
      },
      {
        name: 'Games with no activity for 1+ hour',
        query: {
          status: { $ne: 'ended' },
          lastActivity: { $lt: oneHourAgo }
        }
      },
      {
        name: 'Games older than 24 hours',
        query: {
          status: { $ne: 'ended' },
          createdAt: { $lt: oneDayAgo }
        }
      },
      {
        name: 'Games with 30+ rounds',
        query: {
          status: { $ne: 'ended' },
          $expr: { $gte: [{ $size: { $ifNull: ['$previousRounds', []] } }, 30] }
        }
      }
    ];

    let totalCleaned = 0;

    for (const { name, query } of queries) {
      console.log(`\n🔍 ${name}:`);
      
      const zombieGames = await Game.find(query);
      console.log(`   Found: ${zombieGames.length} games`);
      
      if (zombieGames.length === 0) continue;

      for (const game of zombieGames) {
        await this.endZombieGame(game, 'emergency_cleanup');
        totalCleaned++;
      }
    }

    console.log(`\n✅ Emergency cleanup completed: ${totalCleaned} games ended`);
    return totalCleaned;
  }

  async endZombieGame(game, reason) {
    try {
      const stateAge = Date.now() - new Date(game.currentStateStartedAt).getTime();
      const activityAge = Date.now() - new Date(game.lastActivity).getTime();
      
      console.log(`   🎮 Ending game ${game.code}:`);
      console.log(`      Status: ${game.status}`);
      console.log(`      State age: ${Math.floor(stateAge / 60000)}m`);
      console.log(`      Last activity: ${Math.floor(activityAge / 60000)}m ago`);
      console.log(`      Players: ${game.players.length}`);
      console.log(`      Rounds: ${game.previousRounds?.length || 0}`);

      // Update game to ended state
      game.status = 'ended';
      game.endedAt = new Date();
      game.lastActivity = new Date();
      game.autoEndedReason = reason;
      game.autoEndedAt = new Date();

      // Close state history
      if (game.stateHistory && game.stateHistory.length > 0) {
        const lastState = game.stateHistory[game.stateHistory.length - 1];
        if (!lastState.exitedAt) {
          lastState.exitedAt = new Date();
          lastState.durationMinutes = Math.floor((lastState.exitedAt - lastState.enteredAt) / 60000);
        }
      }

      await game.save();

      // Update final player scores
      try {
        for (const player of game.players) {
          await User.findByIdAndUpdate(player.user, { 
            $set: { score: player.score }
          });
        }
      } catch (scoreError) {
        console.log(`      ⚠️ Error updating scores: ${scoreError.message}`);
      }

      console.log(`      ✅ Game ended successfully`);

    } catch (error) {
      console.log(`      ❌ Error ending game: ${error.message}`);
    }
  }

  async nukeAllActiveGames() {
    console.log('\n💥 NUCLEAR OPTION: ENDING ALL ACTIVE GAMES...\n');
    
    const activeGames = await Game.find({ status: { $ne: 'ended' } });
    console.log(`Found ${activeGames.length} active games to end`);
    
    if (activeGames.length === 0) {
      console.log('No active games found');
      return 0;
    }

    const confirm = process.argv.includes('--confirm-nuke');
    if (!confirm) {
      console.log('⚠️ Add --confirm-nuke flag to actually end all games');
      return 0;
    }

    for (const game of activeGames) {
      await this.endZombieGame(game, 'nuclear_cleanup');
    }

    console.log(`💥 Nuclear cleanup completed: ${activeGames.length} games ended`);
    return activeGames.length;
  }

  async getCleanupStats() {
    console.log('\n📊 CLEANUP STATISTICS:\n');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const [
      totalGames,
      activeGames,
      endedGames,
      recentlyEnded,
      autoEndedGames,
      oldestActiveGame,
      newestGame
    ] = await Promise.all([
      Game.countDocuments(),
      Game.countDocuments({ status: { $ne: 'ended' } }),
      Game.countDocuments({ status: 'ended' }),
      Game.countDocuments({ endedAt: { $gte: oneHourAgo } }),
      Game.countDocuments({ autoEndedReason: { $exists: true } }),
      Game.findOne({ status: { $ne: 'ended' } }).sort({ createdAt: 1 }),
      Game.findOne().sort({ createdAt: -1 })
    ]);

    console.log(`Total games: ${totalGames}`);
    console.log(`Active games: ${activeGames}`);
    console.log(`Ended games: ${endedGames}`);
    console.log(`Ended in last hour: ${recentlyEnded}`);
    console.log(`Auto-ended games: ${autoEndedGames}`);
    
    if (oldestActiveGame) {
      const age = Math.floor((now - oldestActiveGame.createdAt) / 60000);
      console.log(`Oldest active game: ${oldestActiveGame.code} (${age}m old, status: ${oldestActiveGame.status})`);
    }
    
    if (newestGame) {
      const age = Math.floor((now - newestGame.createdAt) / 60000);
      console.log(`Newest game: ${newestGame.code} (${age}m old, status: ${newestGame.status})`);
    }

    // Show potentially problematic games
    const problematicGames = await Game.find({
      status: { $ne: 'ended' },
      $or: [
        { createdAt: { $lt: oneDayAgo } },
        { lastActivity: { $lt: new Date(now.getTime() - (30 * 60 * 1000)) } }
      ]
    }).limit(10);

    if (problematicGames.length > 0) {
      console.log(`\n⚠️ Potentially problematic games:`);
      for (const game of problematicGames) {
        const age = Math.floor((now - game.createdAt) / 60000);
        const lastActivity = Math.floor((now - game.lastActivity) / 60000);
        console.log(`   ${game.code}: ${game.status}, ${age}m old, ${lastActivity}m since activity`);
      }
    }
  }

  async close() {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// CLI interface
async function main() {
  const cleanup = new EmergencyCleanup();
  
  try {
    await cleanup.connectDB();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'stats':
        await cleanup.getCleanupStats();
        break;
        
      case 'cleanup':
        await cleanup.cleanupZombieGames();
        break;
        
      case 'nuke':
        await cleanup.nukeAllActiveGames();
        break;
        
      default:
        console.log(`
🧹 Emergency Cleanup Tool

Usage: node emergencyCleanup.js <command>

Commands:
  stats    - Show cleanup statistics  
  cleanup  - Clean up zombie games (safe)
  nuke     - End ALL active games (requires --confirm-nuke flag)

Examples:
  node emergencyCleanup.js stats
  node emergencyCleanup.js cleanup  
  node emergencyCleanup.js nuke --confirm-nuke
        `);
        break;
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await cleanup.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EmergencyCleanup;