// server/services/gameCleanupService.js - Auto-end stale games
const Game = require('../models/Game');
const User = require('../models/User');

class GameCleanupService {
  constructor() {
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  /**
   * Start the cleanup service - runs every 5 minutes
   */
  start() {
    if (this.isRunning) {
      console.log('Game cleanup service is already running');
      return;
    }

    console.log('🧹 Starting game cleanup service...');
    this.isRunning = true;

    // Run immediately
    this.performCleanup();

    // Then run every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Game cleanup service started - will run every 5 minutes');
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Game cleanup service stopped');
  }

  /**
   * Main cleanup process
   */
  async performCleanup() {
    try {
      console.log('🔍 Checking for stale games...');
      
      const staleGames = await Game.findGamesNeedingAutoEnd();
      
      if (staleGames.length === 0) {
        console.log('✅ No stale games found');
        return;
      }

      console.log(`⚠️ Found ${staleGames.length} stale games to auto-end`);

      for (const game of staleGames) {
        await this.autoEndGame(game);
      }

      console.log(`✅ Cleanup completed - processed ${staleGames.length} games`);

    } catch (error) {
      console.error('❌ Game cleanup error:', error);
    }
  }

  /**
   * Auto-end a specific game
   */
  async autoEndGame(game) {
    try {
      const autoEndInfo = game.shouldAutoEnd();
      
      console.log(`🎮 Auto-ending game ${game.code}:`);
      console.log(`   Reason: ${autoEndInfo.reason}`);
      console.log(`   State: ${game.status} (${autoEndInfo.stateMinutes}m)`);
      console.log(`   Last activity: ${autoEndInfo.inactivityMinutes}m ago`);
      console.log(`   Rounds played: ${autoEndInfo.roundsPlayed}/${game.maxRounds}`);

      // Close any active state in history
      if (game.stateHistory.length > 0) {
        const lastState = game.stateHistory[game.stateHistory.length - 1];
        if (!lastState.exitedAt) {
          lastState.exitedAt = new Date();
          lastState.durationMinutes = Math.floor((lastState.exitedAt - lastState.enteredAt) / 60000);
        }
      }

      // Add final state to history
      game.stateHistory.push({
        state: 'ended',
        enteredAt: new Date()
      });

      // Update game to ended state
      game.status = 'ended';
      game.endedAt = new Date();
      game.lastActivity = new Date();
      
      // Add auto-end metadata
      game.autoEndedReason = autoEndInfo.reason;
      game.autoEndedAt = new Date();

      await game.save();

      // Update user scores in the database (final score sync)
      try {
        for (const player of game.players) {
          await User.findByIdAndUpdate(player.user, { 
            $set: { score: player.score }
          });
        }
      } catch (scoreError) {
        console.error(`Error updating final scores for game ${game.code}:`, scoreError);
      }

      console.log(`✅ Auto-ended game ${game.code} due to ${autoEndInfo.reason}`);

    } catch (error) {
      console.error(`❌ Failed to auto-end game ${game.code}:`, error);
    }
  }

  /**
   * Get cleanup statistics
   */
  async getStats() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      const [
        totalActiveGames,
        staleGames,
        recentlyAutoEnded,
        gamesEndedToday
      ] = await Promise.all([
        Game.countDocuments({ status: { $ne: 'ended' } }),
        Game.findGamesNeedingAutoEnd(),
        Game.countDocuments({ 
          autoEndedAt: { $gte: oneHourAgo },
          status: 'ended'
        }),
        Game.countDocuments({
          endedAt: { $gte: oneDayAgo },
          status: 'ended'
        })
      ]);

      return {
        serviceRunning: this.isRunning,
        totalActiveGames,
        staleGamesCount: staleGames.length,
        staleGames: staleGames.map(g => ({
          code: g.code,
          status: g.status,
          stateMinutes: Math.floor((now - g.currentStateStartedAt) / 60000),
          inactivityMinutes: Math.floor((now - g.lastActivity) / 60000),
          roundsPlayed: g.previousRounds?.length || 0,
          players: g.players.length
        })),
        recentlyAutoEnded,
        gamesEndedToday,
        lastCleanupRun: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Manual cleanup trigger (for testing/admin)
   */
  async manualCleanup() {
    console.log('🔧 Manual cleanup triggered');
    await this.performCleanup();
  }
}

// Export singleton instance
module.exports = new GameCleanupService();